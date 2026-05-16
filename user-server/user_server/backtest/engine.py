"""Backtest engine — replays Style-B on_tick strategies over candles.

The runner module (`user_server.strategies.runner`) is owned by another agent.
We import lazily inside `run()` so tests can monkey-patch a stub `tick` impl
without the real sandbox being importable.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

WARMUP = 20
WINDOW_LOOKBACK = 100


def _candle_get(candle: Any, key: str) -> float:
    """Allow candles to be dicts or objects (e.g. Pydantic Candle)."""
    if isinstance(candle, dict):
        return float(candle[key])
    return float(getattr(candle, key))


@dataclass
class Result:
    sharpe: float
    max_drawdown: float
    total_return: float
    win_rate: float
    n_trades: int
    final_equity: float
    equity_curve: list[float] = field(default_factory=list)
    trades: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "sharpe": self.sharpe,
            "max_drawdown": self.max_drawdown,
            "total_return": self.total_return,
            "win_rate": self.win_rate,
            "n_trades": self.n_trades,
            "final_equity": self.final_equity,
            "equity_curve": list(self.equity_curve),
            "trades": list(self.trades),
        }


def _close_position(
    position: dict,
    exit_price: float,
    fee_bps: float,
    cash: float,
    trades: list[dict],
    reason: str,
) -> float:
    """Close `position` at `exit_price`, append a trade, return new cash."""
    entry = position["entry"]
    size_usdt = position["size_usdt"]
    if position["side"] == "long":
        pnl_frac = (exit_price - entry) / entry
    else:
        pnl_frac = (entry - exit_price) / entry
    pnl_usdt = size_usdt * pnl_frac
    fee = size_usdt * fee_bps / 10000.0
    new_cash = cash + size_usdt + pnl_usdt - fee
    trades.append(
        {
            "side": position["side"],
            "entry": entry,
            "exit": exit_price,
            "size_usdt": size_usdt,
            "pnl_usdt": pnl_usdt,
            "reason": reason,
        }
    )
    return new_cash


def _mtm(position: dict | None, cash: float, price: float) -> float:
    """Mark-to-market equity given current cash + open position."""
    if position is None:
        return cash
    entry = position["entry"]
    size = position["size_usdt"]
    if position["side"] == "long":
        pnl_frac = (price - entry) / entry
    else:
        pnl_frac = (entry - price) / entry
    return cash + size * (1.0 + pnl_frac)


def run(
    handle: Any,
    candles: list[Any],
    initial_usdt: float = 1000.0,
    fee_bps: float = 10.0,
    tick_fn: Callable[..., dict] | None = None,
) -> Result:
    """
    Run a Style-B strategy over `candles`.

    Args:
        handle: opaque strategy handle from runner.load_strategy().
        candles: list of OHLCV candles (dict or Candle).
        initial_usdt: starting cash.
        fee_bps: per-side fee in basis points (10 = 0.1%).
        tick_fn: optional override for the runner.tick callable (for tests).
    """
    from .metrics import max_drawdown as _mdd
    from .metrics import sharpe as _sharpe
    from .metrics import total_return as _tot_ret
    from .metrics import win_rate as _wr

    if tick_fn is None:
        # Lazy import — runner is owned elsewhere, may not be present in tests.
        from ..strategies import runner as _runner  # type: ignore

        tick_fn = _runner.tick  # type: ignore[attr-defined]

    cash = float(initial_usdt)
    position: dict | None = None
    equity_curve: list[float] = [cash]
    trades: list[dict] = []

    n = len(candles)
    if n <= WARMUP:
        return Result(
            sharpe=0.0,
            max_drawdown=0.0,
            total_return=0.0,
            win_rate=0.0,
            n_trades=0,
            final_equity=cash,
            equity_curve=equity_curve,
            trades=trades,
        )

    for i in range(WARMUP, n):
        candle = candles[i]
        high = _candle_get(candle, "high")
        low = _candle_get(candle, "low")
        price = _candle_get(candle, "close")

        # 1) Intra-candle SL/TP check first (if position open + levels set).
        if position is not None:
            sl = position.get("stop_loss")
            tp = position.get("take_profit")
            hit_price: float | None = None
            hit_reason = ""
            if position["side"] == "long":
                if sl is not None and low <= sl:
                    hit_price, hit_reason = sl, "stop_loss"
                elif tp is not None and high >= tp:
                    hit_price, hit_reason = tp, "take_profit"
            else:  # short
                if sl is not None and high >= sl:
                    hit_price, hit_reason = sl, "stop_loss"
                elif tp is not None and low <= tp:
                    hit_price, hit_reason = tp, "take_profit"
            if hit_price is not None:
                cash = _close_position(position, hit_price, fee_bps, cash, trades, hit_reason)
                position = None

        # 2) Build context window and call strategy.
        window = candles[max(0, i - WINDOW_LOOKBACK) : i + 1]
        ctx = {
            "candles": window,
            "position": position,
            "indicators": {},
            "params": {},
        }
        try:
            signal = tick_fn(handle, ctx) or {}
        except Exception:
            signal = {"action": "HOLD", "size": 0.0, "reason": "tick_error"}

        action = signal.get("action", "HOLD")
        try:
            size_frac = float(signal.get("size", 1.0))
        except (TypeError, ValueError):
            size_frac = 1.0
        size_frac = max(0.0, min(1.0, size_frac))
        sl_signal = signal.get("stop_loss")
        tp_signal = signal.get("take_profit")

        # 3) Apply action.
        if action == "OPEN_LONG" and position is None and cash > 0 and size_frac > 0:
            size = cash * size_frac
            fee = size * fee_bps / 10000.0
            position = {
                "side": "long",
                "entry": price,
                "size_usdt": size,
                "stop_loss": float(sl_signal) if sl_signal is not None else None,
                "take_profit": float(tp_signal) if tp_signal is not None else None,
            }
            cash -= size + fee
        elif action == "OPEN_SHORT" and position is None and cash > 0 and size_frac > 0:
            size = cash * size_frac
            fee = size * fee_bps / 10000.0
            position = {
                "side": "short",
                "entry": price,
                "size_usdt": size,
                "stop_loss": float(sl_signal) if sl_signal is not None else None,
                "take_profit": float(tp_signal) if tp_signal is not None else None,
            }
            cash -= size + fee
        elif action == "CLOSE" and position is not None:
            cash = _close_position(position, price, fee_bps, cash, trades, "signal_close")
            position = None
        # else HOLD / no-op

        # 4) Mark-to-market equity.
        equity_curve.append(_mtm(position, cash, price))

    # Force-close any open position at the final close for fair metrics.
    if position is not None:
        last_price = _candle_get(candles[-1], "close")
        cash = _close_position(position, last_price, fee_bps, cash, trades, "force_close")
        position = None
        equity_curve[-1] = cash

    final_equity = equity_curve[-1]
    return Result(
        sharpe=_sharpe(equity_curve),
        max_drawdown=_mdd(equity_curve),
        total_return=_tot_ret(equity_curve, initial_usdt),
        win_rate=_wr(trades),
        n_trades=len(trades),
        final_equity=final_equity,
        equity_curve=equity_curve,
        trades=trades,
    )

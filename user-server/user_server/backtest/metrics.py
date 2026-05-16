"""Performance metrics for backtest equity curves and trade lists."""
from __future__ import annotations

import math
from typing import Iterable, Sequence


def _returns(equity_curve: Sequence[float]) -> list[float]:
    """Per-step simple returns from an equity curve."""
    out: list[float] = []
    for i in range(1, len(equity_curve)):
        prev = equity_curve[i - 1]
        if prev == 0:
            out.append(0.0)
            continue
        out.append((equity_curve[i] - prev) / prev)
    return out


def sharpe(equity_curve: Sequence[float], periods_per_year: int = 365 * 24) -> float:
    """
    Annualized Sharpe ratio. Default periods_per_year matches hourly candles
    over one year. Risk-free rate assumed zero.
    """
    rets = _returns(equity_curve)
    if len(rets) < 2:
        return 0.0
    mean = sum(rets) / len(rets)
    var = sum((r - mean) ** 2 for r in rets) / (len(rets) - 1)
    std = math.sqrt(var)
    if std == 0:
        return 0.0
    return (mean / std) * math.sqrt(periods_per_year)


def max_drawdown(equity_curve: Sequence[float]) -> float:
    """Max peak-to-trough drawdown as a positive fraction (0..1)."""
    if not equity_curve:
        return 0.0
    peak = equity_curve[0]
    mdd = 0.0
    for v in equity_curve:
        if v > peak:
            peak = v
        if peak > 0:
            dd = (peak - v) / peak
            if dd > mdd:
                mdd = dd
    return mdd


def win_rate(trades: Iterable[dict]) -> float:
    """Fraction of closed trades with positive PnL."""
    trades = list(trades)
    if not trades:
        return 0.0
    wins = sum(1 for t in trades if t.get("pnl_usdt", 0) > 0)
    return wins / len(trades)


def total_return(equity_curve: Sequence[float], initial: float) -> float:
    """Total return as a fraction of initial capital."""
    if not equity_curve or initial == 0:
        return 0.0
    return (equity_curve[-1] - initial) / initial

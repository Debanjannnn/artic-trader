"""Dataset cache for backtest engine.

Loads historical candles from `backtest_candles` table when available,
otherwise fetches from TwelveData via the existing `app.market.market`
client and caches the result for next time.

Bound tolerance: matches an existing cache row if its (period_start,
period_end) are within ±1 day of the requested window — keeps cache
hits high for daily-rolling backtests.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models.backtest_candles import BacktestCandles

# Map our granularity strings → TwelveData timeframe + step (used for bar_count).
_GRANULARITY_TO_TIMEFRAME = {
    "1m": ("1m", timedelta(minutes=1)),
    "5m": ("5m", timedelta(minutes=5)),
    "15m": ("15m", timedelta(minutes=15)),
    "30m": ("30m", timedelta(minutes=30)),
    "1h": ("1h", timedelta(hours=1)),
    "2h": ("2h", timedelta(hours=2)),
    "4h": ("4h", timedelta(hours=4)),
    "1d": ("1day", timedelta(days=1)),
    "1day": ("1day", timedelta(days=1)),
}

BOUND_TOLERANCE = timedelta(days=1)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _candle_to_dict(c: Any) -> dict:
    """Coerce a Candle (or dict) to a JSON-serializable dict."""
    if isinstance(c, dict):
        ts = c.get("timestamp")
        if isinstance(ts, datetime):
            ts = ts.isoformat()
        return {
            "timestamp": ts,
            "open": float(c.get("open", 0)),
            "high": float(c.get("high", 0)),
            "low": float(c.get("low", 0)),
            "close": float(c.get("close", 0)),
            "volume": float(c.get("volume", 0)),
        }
    ts = getattr(c, "timestamp", None)
    if isinstance(ts, datetime):
        ts = ts.isoformat()
    return {
        "timestamp": ts,
        "open": float(getattr(c, "open", 0)),
        "high": float(getattr(c, "high", 0)),
        "low": float(getattr(c, "low", 0)),
        "close": float(getattr(c, "close", 0)),
        "volume": float(getattr(c, "volume", 0)),
    }


def _default_fetcher(symbol: str, granularity: str, days: int) -> list[Any]:
    """Real fetcher — calls the TwelveData client used elsewhere in the app."""
    # Imported lazily so test environments without `app.*` on the path can stub.
    from app.market.market import MarketData  # type: ignore

    timeframe, step = _GRANULARITY_TO_TIMEFRAME.get(
        granularity, _GRANULARITY_TO_TIMEFRAME["1h"]
    )
    bar_count = max(1, int(timedelta(days=days) / step))
    md = MarketData()
    candles = md.get_ohlcv_candles(symbol, timeframe, bar_count)
    return candles or []


async def get_candles(
    session: AsyncSession,
    symbol: str,
    days: int = 30,
    granularity: str = "1h",
    fetcher: Callable[[str, str, int], list[Any]] | None = None,
    now: datetime | None = None,
) -> list[dict]:
    """
    Return cached candles for (symbol, granularity, last `days` days).
    On cache miss, fetch via `fetcher` (default = TwelveData client) and
    persist the result.

    Returns: list of dict candles (JSON-shaped).
    """
    if granularity not in _GRANULARITY_TO_TIMEFRAME:
        raise ValueError(f"unsupported granularity: {granularity}")

    end = (now or _now_utc())
    start = end - timedelta(days=days)

    # Cache lookup: same symbol/granularity, bounds within ±1 day tolerance.
    stmt = (
        select(BacktestCandles)
        .where(BacktestCandles.symbol == symbol)
        .where(BacktestCandles.granularity == granularity)
        .where(BacktestCandles.period_start >= start - BOUND_TOLERANCE)
        .where(BacktestCandles.period_start <= start + BOUND_TOLERANCE)
        .where(BacktestCandles.period_end >= end - BOUND_TOLERANCE)
        .where(BacktestCandles.period_end <= end + BOUND_TOLERANCE)
        .order_by(BacktestCandles.cached_at.desc())
        .limit(1)
    )
    res = await session.execute(stmt)
    row = res.scalar_one_or_none()
    if row is not None:
        return list(row.candles_json)

    # Cache miss → fetch + persist.
    fetch = fetcher or _default_fetcher
    raw = fetch(symbol, granularity, days)
    candles_json = [_candle_to_dict(c) for c in raw]

    new_row = BacktestCandles(
        symbol=symbol,
        granularity=granularity,
        period_start=start,
        period_end=end,
        candles_json=candles_json,
    )
    session.add(new_row)
    await session.flush()
    return candles_json

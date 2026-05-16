"""Internal endpoint: validate AST + run backtest for a candidate strategy.

Hub calls this during /strategies/{id}/publish. Returns hashes + bps-scaled
metrics ready for on-chain attestation.
"""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..backtest import datasets, engine
from ..db.base import get_session
from ..security import hub_guard
from .runner import load_strategy
from .sandbox import ASTViolation, RuntimeViolation, SandboxError

router = APIRouter(
    prefix="/internal/strategies",
    tags=["internal-strategies"],
    dependencies=[Depends(hub_guard)],
)


DEFAULT_DAYS = 30
DEFAULT_GRANULARITY = "1h"
EQUITY_SAMPLE_POINTS = 100


class ValidateAndBacktestBody(BaseModel):
    code: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=64)
    symbol: str = Field(default="BTC/USDT")
    days: int = Field(default=DEFAULT_DAYS, ge=1, le=365)
    granularity: str = Field(default=DEFAULT_GRANULARITY)


class ValidateAndBacktestOut(BaseModel):
    strategy_hash: str
    dataset_hash: str
    sharpe_bps: int
    max_dd_bps: int
    total_return_bps: int
    win_rate_bps: int
    n_trades: int
    final_equity: float
    equity_curve_sample: list[float]


def _strategy_hash(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _dataset_hash(symbol: str, period_start: datetime, period_end: datetime, granularity: str) -> str:
    payload = f"{symbol}|{period_start.isoformat()}|{period_end.isoformat()}|{granularity}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _sample_equity(curve: list[float], max_points: int = EQUITY_SAMPLE_POINTS) -> list[float]:
    if not curve:
        return []
    if len(curve) <= max_points:
        return list(curve)
    step = max(1, len(curve) // max_points)
    sampled = curve[::step]
    if sampled[-1] != curve[-1]:
        sampled.append(curve[-1])
    return sampled[:max_points]


def _clamp_int(v: float, lo: int, hi: int) -> int:
    n = int(round(v))
    return max(lo, min(hi, n))


@router.post("/validate-and-backtest", response_model=ValidateAndBacktestOut)
async def validate_and_backtest(
    body: ValidateAndBacktestBody,
    db: AsyncSession = Depends(get_session),
) -> ValidateAndBacktestOut:
    # 1) AST validate + compile.
    try:
        handle = load_strategy(body.code)
    except ASTViolation as exc:
        raise HTTPException(status_code=400, detail={"kind": "ast_violation", "message": str(exc)})
    except RuntimeViolation as exc:
        raise HTTPException(status_code=400, detail={"kind": "runtime_violation", "message": str(exc)})
    except SandboxError as exc:
        raise HTTPException(status_code=400, detail={"kind": "sandbox_error", "message": str(exc)})

    # 2) Fetch candles (cached).
    now = datetime.now(timezone.utc)
    try:
        candles = await datasets.get_candles(
            db,
            symbol=body.symbol,
            days=body.days,
            granularity=body.granularity,
            now=now,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"kind": "bad_dataset", "message": str(exc)})

    # 3) Run backtest.
    result = engine.run(handle, candles)

    # 4) Compute hashes.
    strat_hash = _strategy_hash(body.code)
    period_end = now
    period_start = period_end.replace(microsecond=0)
    # Mirror datasets.get_candles window.
    from datetime import timedelta

    period_start = period_end - timedelta(days=body.days)
    ds_hash = _dataset_hash(body.symbol, period_start, period_end, body.granularity)

    # 5) Scale metrics → bps integers (contract-safe ranges).
    sharpe_bps = _clamp_int(result.sharpe * 100.0, lo=-(2**31 - 1), hi=2**31 - 1)
    # max_dd_bps: uint16 → 0..10000 (cap at 100% drawdown).
    max_dd_bps = _clamp_int(result.max_drawdown * 10000.0, lo=0, hi=10000)
    # total_return_bps: int32; compute from fractional return.
    total_return_bps = _clamp_int(result.total_return * 10000.0, lo=-(2**31 - 1), hi=2**31 - 1)
    # win_rate_bps: uint16 → 0..10000.
    win_rate_bps = _clamp_int(result.win_rate * 10000.0, lo=0, hi=10000)
    n_trades = _clamp_int(float(result.n_trades), lo=0, hi=2**32 - 1)

    return ValidateAndBacktestOut(
        strategy_hash=strat_hash,
        dataset_hash=ds_hash,
        sharpe_bps=sharpe_bps,
        max_dd_bps=max_dd_bps,
        total_return_bps=total_return_bps,
        win_rate_bps=win_rate_bps,
        n_trades=n_trades,
        final_equity=result.final_equity,
        equity_curve_sample=_sample_equity(result.equity_curve),
    )

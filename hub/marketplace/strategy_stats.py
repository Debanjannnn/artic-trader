"""Standalone per-strategy stats endpoint.

Aggregates hub-local trade rows by `strategy_hash` for marketplace UI display.
Kept in its own router file to avoid conflicts with the parallel marketplace
work; mounts at `/strategies/{strategy_hash}/stats`.

Note: production trade data lives on user-server; the long-term plan is for
this endpoint to either federate to user-server or read from a hub-side
mirror. For now it queries hub's `trades` table directly. TODO(batch-3):
stitch into the marketplace router and source from the user-server.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.base import get_session
from ..db.models import Trade

router = APIRouter(prefix="/strategies", tags=["strategy-stats"])


class StrategyStats(BaseModel):
    strategy_hash: str
    n_trades: int
    n_wins: int
    win_rate: float
    avg_pnl_bps: float | None
    total_pnl_usdt: float
    last_trade_at: datetime | None


@router.get("/{strategy_hash}/stats", response_model=StrategyStats)
async def get_strategy_stats(
    strategy_hash: str, db: AsyncSession = Depends(get_session)
) -> StrategyStats:
    win_expr = case((Trade.pnl > 0, 1), else_=0)
    # pnl_bps: realized pnl / notional * 10000. notional ≈ size_usdt*leverage.
    notional = Trade.size_usdt * Trade.leverage
    pnl_bps_expr = case(
        (notional > 0, (Trade.pnl / notional) * 10000),
        else_=None,
    )

    stmt = select(
        func.count(Trade.id),
        func.coalesce(func.sum(win_expr), 0),
        func.avg(pnl_bps_expr),
        func.coalesce(func.sum(Trade.pnl), 0),
        func.max(Trade.closed_at),
    ).where(
        Trade.strategy_hash == strategy_hash,
        Trade.closed_at.is_not(None),
    )
    row = (await db.execute(stmt)).one()
    n_trades, n_wins, avg_pnl_bps, total_pnl_usdt, last_trade_at = row
    win_rate = float(n_wins) / float(n_trades) if n_trades else 0.0
    return StrategyStats(
        strategy_hash=strategy_hash,
        n_trades=int(n_trades or 0),
        n_wins=int(n_wins or 0),
        win_rate=win_rate,
        avg_pnl_bps=float(avg_pnl_bps) if avg_pnl_bps is not None else None,
        total_pnl_usdt=float(total_pnl_usdt or 0),
        last_trade_at=last_trade_at,
    )

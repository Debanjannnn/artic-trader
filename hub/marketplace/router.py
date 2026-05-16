"""Marketplace endpoints — list/detail/report.

Auto-hides any row with `reports_count >= AUTOHIDE_THRESHOLD` or `delisted=True`.
Install lives on the strategies router (POST /strategies/{id}/install).
"""
from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..audit import service as audit
from ..auth.deps import get_current_user
from ..db.base import get_session
from ..db.models.strategy import MarketplaceReport, MarketplaceStrategy
from ..db.models.user import User

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

AUTOHIDE_THRESHOLD = 3


# ── Schemas ─────────────────────────────────────────────────────────────────


class MarketplaceOut(BaseModel):
    id: str
    name: str
    author_user_id: str
    code_hash: str
    description: Optional[str] = None
    installs_count: int
    reports_count: int
    published_at: str

    @classmethod
    def from_row(cls, row: MarketplaceStrategy) -> "MarketplaceOut":
        return cls(
            id=row.id,
            name=row.name,
            author_user_id=row.author_user_id,
            code_hash=row.code_hash,
            description=row.description,
            installs_count=row.installs_count,
            reports_count=row.reports_count,
            published_at=row.published_at.isoformat() if row.published_at else "",
        )


class ReportRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=512)


# ── Endpoints ───────────────────────────────────────────────────────────────


@router.get("", response_model=list[MarketplaceOut])
async def list_marketplace(
    sort: Literal["installed", "newest", "reported"] = Query("newest"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),  # noqa: ARG001 — auth gate only
    db: AsyncSession = Depends(get_session),
):
    """List published marketplace strategies. Hides delisted + auto-hidden rows."""
    stmt = select(MarketplaceStrategy).where(
        MarketplaceStrategy.delisted.is_(False),
        MarketplaceStrategy.reports_count < AUTOHIDE_THRESHOLD,
    )
    if sort == "installed":
        stmt = stmt.order_by(MarketplaceStrategy.installs_count.desc())
    elif sort == "reported":
        stmt = stmt.order_by(MarketplaceStrategy.reports_count.desc())
    else:
        stmt = stmt.order_by(MarketplaceStrategy.published_at.desc())
    stmt = stmt.limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [MarketplaceOut.from_row(r) for r in rows]


@router.get("/{strategy_id}", response_model=MarketplaceOut)
async def get_marketplace_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),  # noqa: ARG001
    db: AsyncSession = Depends(get_session),
):
    """Detail for one marketplace strategy. Hidden rows return 404."""
    row = (
        await db.execute(
            select(MarketplaceStrategy).where(MarketplaceStrategy.id == strategy_id)
        )
    ).scalar_one_or_none()
    if not row or row.delisted or row.reports_count >= AUTOHIDE_THRESHOLD:
        raise HTTPException(status_code=404, detail="Marketplace strategy not found")
    return MarketplaceOut.from_row(row)


@router.post("/{strategy_id}/report", status_code=201)
async def report_marketplace_strategy(
    strategy_id: str,
    body: ReportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Flag a strategy. Idempotent per user — second flag returns 409."""
    mp = (
        await db.execute(
            select(MarketplaceStrategy).where(MarketplaceStrategy.id == strategy_id)
        )
    ).scalar_one_or_none()
    if not mp:
        raise HTTPException(status_code=404, detail="Marketplace strategy not found")

    db.add(
        MarketplaceReport(
            strategy_id=mp.id,
            reporter_user_id=user.id,
            reason=body.reason,
        )
    )
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already reported by this user")

    # Recompute reports_count from source of truth.
    count = (
        await db.execute(
            select(func.count(MarketplaceReport.id)).where(
                MarketplaceReport.strategy_id == mp.id
            )
        )
    ).scalar_one()
    mp.reports_count = int(count)
    await db.commit()
    await audit.record(
        actor=user.id, action="marketplace.report", target=mp.id, db=None
    )
    return {"ok": True, "reports_count": mp.reports_count}

"""Strategy ORM models — hub-side.

Three tables:
  * user_strategies     — per-user library (installed marketplace + authored + builtin refs)
  * marketplace_strategies — published catalogue (one row per published version)
  * marketplace_reports — user flags; auto-hides at 3+ reports

The user-server has its own `strategies` table (`user_server/db/models/strategy.py`)
that records what each *spawned agent* is running. Boundary is documented in
`/docs/connections/service-map.md`.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from ..base import Base

STRATEGY_SOURCES = ("builtin", "marketplace", "authored")


class UserStrategy(Base):
    """A strategy in a user's library."""

    __tablename__ = "user_strategies"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_strategies_name"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    source: Mapped[str] = mapped_column(String, nullable=False)  # builtin|marketplace|authored
    name: Mapped[str] = mapped_column(String, nullable=False)
    code_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    code_blob: Mapped[str | None] = mapped_column(Text, nullable=True)
    params_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    marketplace_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("marketplace_strategies.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class MarketplaceStrategy(Base):
    """Published strategy in the public marketplace."""

    __tablename__ = "marketplace_strategies"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    author_user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    code_hash: Mapped[str] = mapped_column(String, nullable=False, index=True)
    code_blob: Mapped[str] = mapped_column(Text, nullable=False)
    params_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    installs_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reports_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    delisted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    # Backtest metrics + on-chain tx hashes (set on publish flow).
    sharpe_bps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_dd_bps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_return_bps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    win_rate_bps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    n_trades: Mapped[int | None] = mapped_column(Integer, nullable=True)
    registry_tx: Mapped[str | None] = mapped_column(String, nullable=True)
    attest_tx: Mapped[str | None] = mapped_column(String, nullable=True)
    # ERC-7857 INFT (Agent ID) — minted at publish, encrypted config sealed
    inft_token_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inft_mint_tx: Mapped[str | None] = mapped_column(String, nullable=True)


class MarketplaceReport(Base):
    """User flag against a marketplace strategy. Idempotent per (strategy, user)."""

    __tablename__ = "marketplace_reports"
    __table_args__ = (
        UniqueConstraint(
            "strategy_id", "reporter_user_id", name="uq_marketplace_reports_user"
        ),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    strategy_id: Mapped[str] = mapped_column(
        String, ForeignKey("marketplace_strategies.id"), nullable=False, index=True
    )
    reporter_user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

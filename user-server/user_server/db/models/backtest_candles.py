"""BacktestCandles ORM — cached OHLCV windows used by the backtest engine."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DateTime

from ..base import Base


class BacktestCandles(Base):
    __tablename__ = "backtest_candles"
    __table_args__ = (
        UniqueConstraint(
            "symbol",
            "granularity",
            "period_start",
            "period_end",
            name="uq_backtest_candles_window",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    granularity: Mapped[str] = mapped_column(String, nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    candles_json: Mapped[list] = mapped_column(JSONB, nullable=False)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

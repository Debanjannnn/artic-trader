"""trades: add strategy_hash for per-strategy attribution.

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-04
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision: str = "0005"
down_revision: str | None = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "trades",
        sa.Column("strategy_hash", sa.String(), nullable=True),
    )
    op.create_index("ix_trades_strategy_hash", "trades", ["strategy_hash"])


def downgrade() -> None:
    op.drop_index("ix_trades_strategy_hash", table_name="trades")
    op.drop_column("trades", "strategy_hash")

"""Add strategy_hash column to trades for per-strategy attribution.

Revision ID: 0005_trade_strategy_hash
Revises: 0004
Create Date: 2026-05-04
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "trades",
        sa.Column("strategy_hash", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_trades_strategy_hash", "trades", ["strategy_hash"]
    )


def downgrade() -> None:
    op.drop_index("ix_trades_strategy_hash", table_name="trades")
    op.drop_column("trades", "strategy_hash")

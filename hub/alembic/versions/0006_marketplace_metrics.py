"""Add backtest metrics + on-chain tx hash columns to marketplace_strategies.

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-04
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("marketplace_strategies", sa.Column("sharpe_bps", sa.Integer(), nullable=True))
    op.add_column("marketplace_strategies", sa.Column("max_dd_bps", sa.Integer(), nullable=True))
    op.add_column(
        "marketplace_strategies", sa.Column("total_return_bps", sa.Integer(), nullable=True)
    )
    op.add_column("marketplace_strategies", sa.Column("win_rate_bps", sa.Integer(), nullable=True))
    op.add_column("marketplace_strategies", sa.Column("n_trades", sa.Integer(), nullable=True))
    op.add_column("marketplace_strategies", sa.Column("registry_tx", sa.String(), nullable=True))
    op.add_column("marketplace_strategies", sa.Column("attest_tx", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("marketplace_strategies", "attest_tx")
    op.drop_column("marketplace_strategies", "registry_tx")
    op.drop_column("marketplace_strategies", "n_trades")
    op.drop_column("marketplace_strategies", "win_rate_bps")
    op.drop_column("marketplace_strategies", "total_return_bps")
    op.drop_column("marketplace_strategies", "max_dd_bps")
    op.drop_column("marketplace_strategies", "sharpe_bps")

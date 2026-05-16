"""Add INFT minting columns to marketplace_strategies.

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE marketplace_strategies ADD COLUMN IF NOT EXISTS inft_token_id INTEGER")
    op.execute("ALTER TABLE marketplace_strategies ADD COLUMN IF NOT EXISTS inft_mint_tx VARCHAR")


def downgrade() -> None:
    op.drop_column("marketplace_strategies", "inft_mint_tx")
    op.drop_column("marketplace_strategies", "inft_token_id")

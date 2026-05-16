"""Add reasoning_cid (0G Storage root hash) column to trades.

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE trades ADD COLUMN IF NOT EXISTS reasoning_cid VARCHAR")


def downgrade() -> None:
    op.drop_column("trades", "reasoning_cid")

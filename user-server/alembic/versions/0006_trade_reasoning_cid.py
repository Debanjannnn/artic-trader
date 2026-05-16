"""Add reasoning_cid (0G Storage root hash) column to trades.

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trades", sa.Column("reasoning_cid", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("trades", "reasoning_cid")

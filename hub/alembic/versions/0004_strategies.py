"""Add user_strategies, marketplace_strategies, marketplace_reports tables

Revision ID: 0004_strategies
Revises: 0003_vm_audit_refresh
Create Date: 2026-05-04
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "marketplace_strategies",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "author_user_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False, index=True),
        sa.Column("code_blob", sa.Text(), nullable=False),
        sa.Column("params_schema", sa.JSON(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("installs_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reports_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "delisted", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "user_strategies",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=True),
        sa.Column("code_blob", sa.Text(), nullable=True),
        sa.Column("params_schema", sa.JSON(), nullable=True),
        sa.Column(
            "marketplace_id",
            sa.String(),
            sa.ForeignKey("marketplace_strategies.id"),
            nullable=True,
            index=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "name", name="uq_user_strategies_name"),
    )

    op.create_table(
        "marketplace_reports",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "strategy_id",
            sa.String(),
            sa.ForeignKey("marketplace_strategies.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "reporter_user_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "strategy_id", "reporter_user_id", name="uq_marketplace_reports_user"
        ),
    )


def downgrade() -> None:
    op.drop_table("marketplace_reports")
    op.drop_table("user_strategies")
    op.drop_table("marketplace_strategies")

"""add payment_method to orders

Revision ID: 41e892c5bb71
Revises: 396093b5b991
Create Date: 2026-10-01 16:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '41e892c5bb71'
down_revision: Union[str, Sequence[str], None] = '396093b5b991'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if column already exists before adding
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('orders')]
    if 'payment_method' not in columns:
        op.add_column('orders', sa.Column('payment_method', sa.String(length=50), nullable=True, server_default='UPI'))


def downgrade() -> None:
    op.drop_column('orders', 'payment_method')

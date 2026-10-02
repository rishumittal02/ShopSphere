"""add verification and payment fields

Revision ID: 5a918e7c2f10
Revises: 41e892c5bb71
Create Date: 2026-10-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '5a918e7c2f10'
down_revision = '41e892c5bb71'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    user_columns = [c['name'] for c in inspector.get_columns('users')]
    order_columns = [c['name'] for c in inspector.get_columns('orders')]

    if 'is_verified' not in user_columns:
        op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('1')))
    if 'verification_code' not in user_columns:
        op.add_column('users', sa.Column('verification_code', sa.String(length=10), nullable=True))
    if 'verification_code_expires_at' not in user_columns:
        op.add_column('users', sa.Column('verification_code_expires_at', sa.DateTime(), nullable=True))
    if 'reset_password_token' not in user_columns:
        op.add_column('users', sa.Column('reset_password_token', sa.String(length=255), nullable=True))
        op.create_index(op.f('ix_users_reset_password_token'), 'users', ['reset_password_token'], unique=False)
    if 'reset_password_expires_at' not in user_columns:
        op.add_column('users', sa.Column('reset_password_expires_at', sa.DateTime(), nullable=True))

    if 'payment_id' not in order_columns:
        op.add_column('orders', sa.Column('payment_id', sa.String(length=100), nullable=True))
    if 'razorpay_order_id' not in order_columns:
        op.add_column('orders', sa.Column('razorpay_order_id', sa.String(length=100), nullable=True))


def downgrade():
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    user_columns = [c['name'] for c in inspector.get_columns('users')]
    order_columns = [c['name'] for c in inspector.get_columns('orders')]

    if 'razorpay_order_id' in order_columns:
        op.drop_column('orders', 'razorpay_order_id')
    if 'payment_id' in order_columns:
        op.drop_column('orders', 'payment_id')

    if 'reset_password_expires_at' in user_columns:
        op.drop_column('users', 'reset_password_expires_at')
    if 'reset_password_token' in user_columns:
        op.drop_index(op.f('ix_users_reset_password_token'), table_name='users')
        op.drop_column('users', 'reset_password_token')
    if 'verification_code_expires_at' in user_columns:
        op.drop_column('users', 'verification_code_expires_at')
    if 'verification_code' in user_columns:
        op.drop_column('users', 'verification_code')
    if 'is_verified' in user_columns:
        op.drop_column('users', 'is_verified')

"""security hardening reviews and order snapshots

Revision ID: 6b819e9d3f21
Revises: 5a918e7c2f10
Create Date: 2026-10-02 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '6b819e9d3f21'
down_revision = '5a918e7c2f10'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()
    user_columns = [c['name'] for c in inspector.get_columns('users')]
    order_item_columns = [c['name'] for c in inspector.get_columns('order_items')]

    # Users security enhancements
    if 'verification_code_hash' not in user_columns:
        op.add_column('users', sa.Column('verification_code_hash', sa.String(length=128), nullable=True))
    if 'verification_attempts' not in user_columns:
        op.add_column('users', sa.Column('verification_attempts', sa.Integer(), nullable=False, server_default='0'))
    if 'verification_code_sent_at' not in user_columns:
        op.add_column('users', sa.Column('verification_code_sent_at', sa.DateTime(), nullable=True))
    if 'token_version' not in user_columns:
        op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default='1'))

    # Order item snapshots
    if 'product_name' not in order_item_columns:
        op.add_column('order_items', sa.Column('product_name', sa.String(length=255), nullable=True))

    # Product reviews table
    if 'reviews' not in tables:
        op.create_table(
            'reviews',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('product_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('rating', sa.Integer(), nullable=False),
            sa.Column('comment', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_reviews_id'), 'reviews', ['id'], unique=False)
        op.create_index(op.f('ix_reviews_product_id'), 'reviews', ['product_id'], unique=False)


def downgrade():
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()
    user_columns = [c['name'] for c in inspector.get_columns('users')]
    order_item_columns = [c['name'] for c in inspector.get_columns('order_items')]

    if 'reviews' in tables:
        op.drop_index(op.f('ix_reviews_product_id'), table_name='reviews')
        op.drop_index(op.f('ix_reviews_id'), table_name='reviews')
        op.drop_table('reviews')

    if 'product_name' in order_item_columns:
        op.drop_column('order_items', 'product_name')

    if 'token_version' in user_columns:
        op.drop_column('users', 'token_version')
    if 'verification_code_sent_at' in user_columns:
        op.drop_column('users', 'verification_code_sent_at')
    if 'verification_attempts' in user_columns:
        op.drop_column('users', 'verification_attempts')
    if 'verification_code_hash' in user_columns:
        op.drop_column('users', 'verification_code_hash')

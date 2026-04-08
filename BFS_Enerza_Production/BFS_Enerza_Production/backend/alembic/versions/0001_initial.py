"""Initial BFS Enerza schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create schema
    op.execute("CREATE SCHEMA IF NOT EXISTS public")

    # system_users — must be first (referenced by others)
    op.create_table('system_users',
        sa.Column('user_id',          sa.String(20),  primary_key=True),
        sa.Column('username',         sa.String(50),  unique=True, nullable=False),
        sa.Column('email',            sa.String(100), unique=True, nullable=False),
        sa.Column('full_name',        sa.String(100), nullable=False),
        sa.Column('hashed_password',  sa.String(200), nullable=False),
        sa.Column('role',             sa.String(30),  nullable=False, default='READ_ONLY'),
        sa.Column('department',       sa.String(50)),
        sa.Column('is_active',        sa.Boolean,     nullable=False, default=True),
        sa.Column('last_login',       sa.DateTime(timezone=True)),
        sa.Column('created_on',       sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('changed_on',       sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # audit_log
    op.create_table('audit_log',
        sa.Column('log_id',      sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id',     sa.String(20), sa.ForeignKey('system_users.user_id')),
        sa.Column('table_name',  sa.String(50), nullable=False),
        sa.Column('record_id',   sa.String(30), nullable=False),
        sa.Column('action',      sa.String(20), nullable=False),
        sa.Column('old_values',  sa.Text),
        sa.Column('new_values',  sa.Text),
        sa.Column('ip_address',  sa.String(50)),
        sa.Column('created_on',  sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_audit_table_record', 'audit_log', ['table_name', 'record_id'])

    # Insert default super admin (password: Enerza@2026 — change immediately)
    op.execute("""
        INSERT INTO system_users (user_id, username, email, full_name, hashed_password, role, is_active)
        VALUES (
            'USR00000001',
            'superadmin',
            'admin@bfsenerza.in',
            'BFS Enerza Super Admin',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSdMuQk9HQHJMzMZKXYHrKK',
            'SUPER_ADMIN',
            true
        )
        ON CONFLICT DO NOTHING;
    """)
    # Note: hash above = bcrypt('Enerza@2026') — MUST CHANGE IN PRODUCTION

def downgrade() -> None:
    op.drop_index('ix_audit_table_record', 'audit_log')
    op.drop_table('audit_log')
    op.drop_table('system_users')

"""rename day_start_time to day_start and add day_end

Revision ID: a7756ba2ddf2
Revises: 2bdabb148044
Create Date: 2026-08-01 14:09:09.499651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a7756ba2ddf2'
down_revision: Union[str, Sequence[str], None] = '2bdabb148044'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('user_settings', 'day_start_time', new_column_name='day_start')
    op.execute("UPDATE user_settings SET day_start = '08:00:00' WHERE day_start = '04:00:00'")
    op.add_column('user_settings', sa.Column('day_end', sa.Time(), nullable=False, server_default='23:00:00'))


def downgrade() -> None:
    op.drop_column('user_settings', 'day_end')
    op.execute("UPDATE user_settings SET day_start = '04:00:00' WHERE day_start = '08:00:00'")
    op.alter_column('user_settings', 'day_start', new_column_name='day_start_time')

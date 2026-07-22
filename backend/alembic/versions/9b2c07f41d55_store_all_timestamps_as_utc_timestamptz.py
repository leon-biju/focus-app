"""store all timestamps as utc timestamptz

Revision ID: 9b2c07f41d55
Revises: 5077e23b9ee2
Create Date: 2026-07-22 17:12:03.418206

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b2c07f41d55'
down_revision: Union[str, Sequence[str], None] = '5077e23b9ee2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# table, column, nullable, server default.
# The refresh_tokens columns were already timestamptz, so they aren't listed here.
COLUMNS = [
    ('users', 'created_at', False, sa.text('now()')),
    ('tasks', 'created_at', False, sa.text('now()')),
    ('tasks', 'completed_at', True, None),
    ('notes', 'created_at', False, sa.text('now()')),
]


def _convert(to_timezone: bool) -> None:
    old, new = (sa.DateTime(), sa.DateTime(timezone=True))
    if not to_timezone:
        old, new = new, old

    for table, column, nullable, server_default in COLUMNS:
        op.alter_column(
            table,
            column,
            type_=new,
            existing_type=old,
            existing_nullable=nullable,
            existing_server_default=server_default,
            # Existing values were written by now() into a naive column and the DB
            # container runs on UTC, so say UTC explicitly rather than letting the
            # conversion fall back to whatever the session TimeZone happens to be.
            postgresql_using=f"{column} AT TIME ZONE 'UTC'",
        )


def upgrade() -> None:
    """Upgrade schema."""
    _convert(to_timezone=True)


def downgrade() -> None:
    """Downgrade schema."""
    _convert(to_timezone=False)

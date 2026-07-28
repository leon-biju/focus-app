import uuid

import pytest
from pydantic import ValidationError

from app.time_blocks.schemas import TimeBlockCreate, TimeBlockUpdate


class TestInboundDatetimesMustBeAware:
    # A naive datetime is what <input type="datetime-local"> sends. Plain
    # `datetime` would accept it and asyncpg would then read it in the server
    # process's local zone, silently shifting the block onto another day.
    def test_naive_start_at_is_rejected(self):
        with pytest.raises(ValidationError):
            TimeBlockCreate(
                title="Deep work",
                start_at="2026-07-28T09:30:00",
                end_at="2026-07-28T10:30:00Z",
            )

    def test_naive_end_at_is_rejected(self):
        with pytest.raises(ValidationError):
            TimeBlockCreate(
                title="Deep work",
                start_at="2026-07-28T09:30:00Z",
                end_at="2026-07-28T10:30:00",
            )

    def test_naive_datetimes_are_rejected_on_update_too(self):
        with pytest.raises(ValidationError):
            TimeBlockUpdate(start_at="2026-07-28T09:30:00")

    def test_a_non_utc_offset_is_accepted(self):
        payload = TimeBlockCreate(
            title="Deep work",
            start_at="2026-07-28T09:30:00+01:00",
            end_at="2026-07-28T10:30:00+01:00",
        )
        assert payload.start_at.utcoffset().total_seconds() == 3600


class TestCreateRangeValidation:
    # The DB has a CheckConstraint for this; catching it in the schema keeps a
    # bad POST a 422 instead of an unhandled IntegrityError.
    def test_equal_start_and_end_is_rejected(self):
        with pytest.raises(ValidationError):
            TimeBlockCreate(
                title="Deep work",
                start_at="2026-07-28T09:30:00Z",
                end_at="2026-07-28T09:30:00Z",
            )

    def test_end_before_start_is_rejected(self):
        with pytest.raises(ValidationError):
            TimeBlockCreate(
                title="Deep work",
                start_at="2026-07-28T10:30:00Z",
                end_at="2026-07-28T09:30:00Z",
            )

    def test_a_forward_range_is_accepted(self):
        payload = TimeBlockCreate(
            title="Deep work",
            start_at="2026-07-28T09:30:00Z",
            end_at="2026-07-28T10:30:00Z",
        )
        assert payload.end_at > payload.start_at


class TestUpdateIsStrict:
    # Conflicts are detected by version_id_col on the row, not by a version in
    # the body. A client sending one has misunderstood the contract and should
    # hear about it rather than have it silently dropped.
    def test_version_id_is_rejected(self):
        with pytest.raises(ValidationError):
            TimeBlockUpdate(version_id=3)

    def test_user_id_is_rejected(self):
        with pytest.raises(ValidationError):
            TimeBlockUpdate(user_id=str(uuid.uuid4()))


class TestUpdateDistinguishesOmittedFromNull:
    # exclude_unset is the only thing separating "leave the link alone" from
    # "unlink this block", so both shapes must survive model_dump.
    def test_omitted_task_id_is_absent_from_the_dump(self):
        payload = TimeBlockUpdate(title="renamed")
        assert payload.model_dump(exclude_unset=True) == {"title": "renamed"}

    def test_explicit_null_task_id_is_present_in_the_dump(self):
        payload = TimeBlockUpdate(task_id=None)
        assert payload.model_dump(exclude_unset=True) == {"task_id": None}

    def test_a_set_task_id_is_present_in_the_dump(self):
        task_id = uuid.uuid4()
        payload = TimeBlockUpdate(task_id=str(task_id))
        assert payload.model_dump(exclude_unset=True) == {"task_id": task_id}

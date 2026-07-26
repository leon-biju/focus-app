import pytest
from pydantic import ValidationError

from app.tasks.schemas import TaskUpdate


class TestStatusIsNotClientWritable:
    # Completion goes through /tasks/{id}/done; in_progress is set by timeblock
    # linking. A PATCH carrying status must fail loudly rather than no-op.
    def test_status_rejected(self):
        with pytest.raises(ValidationError):
            TaskUpdate(status="done")

    def test_completed_at_rejected(self):
        with pytest.raises(ValidationError):
            TaskUpdate(completed_at="2026-07-25T12:00:00Z")

    def test_ordinary_fields_still_accepted(self):
        payload = TaskUpdate(title="renamed", estimate_minutes=25)
        assert payload.model_dump(exclude_unset=True) == {
            "title": "renamed",
            "estimate_minutes": 25,
        }

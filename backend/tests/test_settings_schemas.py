from datetime import time

import pytest
from pydantic import ValidationError

from app.users.schemas import UserSettingsUpdate


class TestTimezoneValidation:
    def test_valid_iana_name_accepted(self):
        assert UserSettingsUpdate(timezone="Europe/London").timezone == "Europe/London"

    def test_unknown_timezone_rejected(self):
        with pytest.raises(ValidationError):
            UserSettingsUpdate(timezone="Mars/Olympus")

    def test_offset_string_rejected(self):
        with pytest.raises(ValidationError):
            UserSettingsUpdate(timezone="+01:00")


class TestDayStartValidation:
    def test_four_am_accepted(self):
        assert UserSettingsUpdate(day_start=time(4, 0)).day_start == time(4, 0)


class TestDayEndValidation:
    def test_day_end_after_day_start_accepted(self):
        s = UserSettingsUpdate(day_start=time(8, 0), day_end=time(23, 0))
        assert s.day_end == time(23, 0)

    def test_day_end_before_day_start_rejected(self):
        with pytest.raises(ValidationError):
            UserSettingsUpdate(day_start=time(10, 0), day_end=time(9, 0))

    def test_day_end_equal_to_day_start_rejected(self):
        with pytest.raises(ValidationError):
            UserSettingsUpdate(day_start=time(8, 0), day_end=time(8, 0))

    def test_day_end_alone_accepted(self):
        s = UserSettingsUpdate(day_end=time(22, 0))
        assert s.day_end == time(22, 0)


class TestOmittedFields:
    def test_omitted_fields_stay_unset(self):
        assert UserSettingsUpdate().model_dump(exclude_unset=True) == {}

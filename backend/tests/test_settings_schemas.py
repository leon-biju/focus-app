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
        assert UserSettingsUpdate(day_start_time=time(4, 0)).day_start_time == time(4, 0)

    def test_before_four_am_rejected(self):
        with pytest.raises(ValidationError):
            UserSettingsUpdate(day_start_time=time(2, 0))

    def test_omitted_fields_stay_unset(self):
        assert UserSettingsUpdate().model_dump(exclude_unset=True) == {}

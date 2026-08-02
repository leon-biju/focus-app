from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.core.time import day_window, valid_timezones

DAY_START = time(8, 0)
DAY_END = time(23, 0)


class TestDayWindow:
    def test_returns_utc_aware_interval(self):
        start, end = day_window(date(2026, 7, 25), "UTC", DAY_START, DAY_END)
        assert start == datetime(2026, 7, 25, 8, 0, tzinfo=UTC)
        assert end == datetime(2026, 7, 25, 23, 0, tzinfo=UTC)
        assert start.tzinfo is UTC and end.tzinfo is UTC

    def test_session_length(self):
        start, end = day_window(date(2026, 7, 25), "UTC", DAY_START, DAY_END)
        assert end - start == timedelta(hours=15)

    def test_converts_local_to_utc(self):
        start, end = day_window(date(2026, 7, 25), "America/New_York", DAY_START, DAY_END)
        # EDT is UTC-4
        assert start == datetime(2026, 7, 25, 12, 0, tzinfo=UTC)
        assert end == datetime(2026, 7, 26, 3, 0, tzinfo=UTC)

    def test_spring_forward_shortens_session(self):
        # US DST starts 2026-03-08 02:00 local, clocks jump to 03:00.
        # A session from 08:00-23:00 is fully after the jump so no change.
        start, end = day_window(date(2026, 3, 8), "America/New_York", DAY_START, DAY_END)
        assert end - start == timedelta(hours=15)

    def test_fall_back_keeps_session_length(self):
        # US DST ends 2026-11-01 02:00 local, clocks fall back to 01:00.
        # A session from 08:00-23:00 is fully after the rollback so no change.
        start, end = day_window(date(2026, 11, 1), "America/New_York", DAY_START, DAY_END)
        assert end - start == timedelta(hours=15)


def test_valid_timezones_contains_iana_names_only():
    zones = valid_timezones()
    assert "America/New_York" in zones
    assert "UTC" in zones
    assert "Mars/Olympus" not in zones

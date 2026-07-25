from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.core.time import day_window, logical_date, valid_timezones

CUTOFF = time(4, 0)


class TestLogicalDate:
    def test_before_cutoff_counts_toward_previous_day(self):
        instant = datetime(2026, 7, 25, 3, 59, tzinfo=UTC)
        assert logical_date(instant, "UTC", CUTOFF) == date(2026, 7, 24)

    def test_exactly_at_cutoff_starts_the_new_day(self):
        instant = datetime(2026, 7, 25, 4, 0, 0, tzinfo=UTC)
        assert logical_date(instant, "UTC", CUTOFF) == date(2026, 7, 25)

    def test_after_cutoff_is_same_day(self):
        instant = datetime(2026, 7, 25, 23, 0, tzinfo=UTC)
        assert logical_date(instant, "UTC", CUTOFF) == date(2026, 7, 25)

    def test_uses_user_timezone_not_utc(self):
        # 02:00 UTC on the 25th is 22:00 on the 24th in New York
        instant = datetime(2026, 7, 25, 2, 0, tzinfo=UTC)
        assert logical_date(instant, "America/New_York", CUTOFF) == date(2026, 7, 24)

    def test_non_utc_instant_is_handled(self):
        instant = datetime(2026, 7, 25, 12, 0, tzinfo=ZoneInfo("Asia/Tokyo"))
        assert logical_date(instant, "Asia/Tokyo", CUTOFF) == date(2026, 7, 25)

    def test_naive_instant_rejected(self):
        with pytest.raises(ValueError):
            logical_date(datetime(2026, 7, 25, 12, 0), "UTC", CUTOFF)


class TestDayWindow:
    def test_returns_utc_aware_half_open_interval(self):
        start, end = day_window(date(2026, 7, 25), "UTC", CUTOFF)
        assert start == datetime(2026, 7, 25, 4, 0, tzinfo=UTC)
        assert end == datetime(2026, 7, 26, 4, 0, tzinfo=UTC)
        assert start.tzinfo is UTC and end.tzinfo is UTC

    # US DST changes at 02:00 local, which a 04:00 cutoff places inside the
    # *previous* logical day: the transition on calendar date 03-08 lands in
    # logical day 03-07 ([03-07 04:00, 03-08 04:00)).

    def test_logical_day_containing_spring_forward_is_23_hours(self):
        # US DST starts 2026-03-08 02:00 local
        start, end = day_window(date(2026, 3, 7), "America/New_York", CUTOFF)
        assert end - start == timedelta(hours=23)

    def test_logical_day_containing_fall_back_is_25_hours(self):
        # US DST ends 2026-11-01 02:00 local
        start, end = day_window(date(2026, 10, 31), "America/New_York", CUTOFF)
        assert end - start == timedelta(hours=25)

    def test_calendar_date_of_dst_change_is_a_normal_24_hour_day(self):
        start, end = day_window(date(2026, 3, 8), "America/New_York", CUTOFF)
        assert end - start == timedelta(hours=24)


class TestWriteReadPathsAgree:
    # The window's endpoints must round-trip through logical_date, including
    # across DST transitions: start belongs to the day, end to the next.
    @pytest.mark.parametrize("day", [
        date(2026, 7, 25),
        date(2026, 3, 7),    # logical day containing US spring-forward
        date(2026, 10, 31),  # logical day containing US fall-back
    ])
    @pytest.mark.parametrize("tz", ["UTC", "America/New_York", "Australia/Sydney"])
    def test_window_endpoints_round_trip(self, day, tz):
        start, end = day_window(day, tz, CUTOFF)
        assert logical_date(start, tz, CUTOFF) == day
        assert logical_date(end - timedelta(microseconds=1), tz, CUTOFF) == day
        assert logical_date(end, tz, CUTOFF) == day + timedelta(days=1)


def test_valid_timezones_contains_iana_names_only():
    zones = valid_timezones()
    assert "America/New_York" in zones
    assert "UTC" in zones
    assert "Mars/Olympus" not in zones

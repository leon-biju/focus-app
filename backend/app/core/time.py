from datetime import UTC, datetime, time, date
from functools import lru_cache
from zoneinfo import ZoneInfo, available_timezones


@lru_cache(maxsize=1)
def valid_timezones() -> frozenset[str]:
    return frozenset(available_timezones())


def day_window(day: date, tz: str, day_start: time, day_end: time) -> tuple[datetime, datetime]:
    zone = ZoneInfo(tz)
    start = datetime.combine(day, day_start, tzinfo=zone)
    end   = datetime.combine(day, day_end, tzinfo=zone)
    return start.astimezone(UTC), end.astimezone(UTC)

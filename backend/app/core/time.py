from datetime import UTC, datetime, time, date, timedelta
from functools import lru_cache
from zoneinfo import ZoneInfo, available_timezones


@lru_cache(maxsize=1)
def valid_timezones() -> frozenset[str]:
    return frozenset(available_timezones())


def logical_date(instant: datetime, tz: str, day_start: time) -> date:
    if instant.tzinfo is None:
        raise ValueError("instant must be timezone-aware")
    local = instant.astimezone(ZoneInfo(tz))
    if local.time() < day_start:
        return local.date() - timedelta(days=1)
    return local.date()


def day_window(day: date, tz: str, day_start: time) -> tuple[datetime, datetime]:
    zone = ZoneInfo(tz)
    start = datetime.combine(day, day_start, tzinfo=zone)
    end   = datetime.combine(day + timedelta(days=1), day_start, tzinfo=zone)
    return start.astimezone(UTC), end.astimezone(UTC)   # [start, end)

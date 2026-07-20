import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.security import generate_refresh_token, hash_refresh_token
from app.users.models import RefreshToken, User

from tests.conftest import register_and_login

COOKIE = "refresh_token"
COOKIE_PATH = "/api/auth"


def get_refresh_cookie(client) -> str | None:
    return client.cookies.get(COOKIE)


def set_refresh_cookie(client, value: str) -> None:
    # Purge existing refresh_token cookies first: a manually-set cookie
    # (explicit domain) is a *different* jar entry than the server-set one
    # (host-only), and we must not send both.
    for cookie in list(client.cookies.jar):
        if cookie.name == COOKIE:
            client.cookies.jar.clear(cookie.domain, cookie.path, cookie.name)
    client.cookies.set(COOKIE, value, domain="test", path=COOKIE_PATH)


async def test_login_sets_refresh_cookie_attributes(client):
    await register_and_login(client)
    # register_and_login's login response is gone; log in again to inspect headers
    r = await client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    set_cookie = r.headers["set-cookie"]
    assert f"{COOKIE}=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert f"Path={COOKIE_PATH}" in set_cookie
    assert "Max-Age=2592000" in set_cookie  # 30 days
    # cookie_secure defaults to False in dev/tests
    assert "Secure" not in set_cookie


async def test_refresh_happy_path(client, registered_user):
    old_cookie = get_refresh_cookie(client)

    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"

    # cookie rotated
    assert get_refresh_cookie(client) != old_cookie

    # the new access token works
    me = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200


async def test_rotation_invalidates_old_token(client, registered_user):
    old_cookie = get_refresh_cookie(client)

    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200

    set_refresh_cookie(client, old_cookie)
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401


async def test_reuse_detection_revokes_family(client, registered_user):
    old_cookie = get_refresh_cookie(client)

    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200
    legit_cookie = get_refresh_cookie(client)

    # replay the rotated-out token -> theft signal, family revoked
    set_refresh_cookie(client, old_cookie)
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401

    # the legitimate, never-reused token is now dead too
    set_refresh_cookie(client, legit_cookie)
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401


async def test_families_are_isolated_per_device(client_factory):
    device_a = client_factory()
    device_b = client_factory()

    await register_and_login(device_a)
    await register_and_login(device_b)  # same user, second login -> own family

    # nuke device A's family via reuse
    old_a = get_refresh_cookie(device_a)
    assert (await device_a.post("/api/auth/refresh")).status_code == 200
    set_refresh_cookie(device_a, old_a)
    assert (await device_a.post("/api/auth/refresh")).status_code == 401

    # device B is unaffected
    assert (await device_b.post("/api/auth/refresh")).status_code == 200


async def test_refresh_without_cookie(client):
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401


async def test_refresh_with_garbage_cookie_clears_it(client):
    set_refresh_cookie(client, "not-a-real-token")
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401
    # the 401 must clear the cookie (empty value, immediate expiry)
    set_cookie = r.headers["set-cookie"]
    assert f'{COOKIE}=""' in set_cookie or f"{COOKIE}=;" in set_cookie
    assert f"Path={COOKIE_PATH}" in set_cookie


async def test_expired_token_rejected(client, registered_user, db_session):
    user_id = (
        await db_session.execute(select(User.id).where(User.email == registered_user["email"]))
    ).scalar_one()

    raw = generate_refresh_token()
    db_session.add(
        RefreshToken(
            user_id=user_id,
            family_id=uuid.uuid4(),
            token_hash=hash_refresh_token(raw),
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
    )
    await db_session.commit()

    set_refresh_cookie(client, raw)
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401


async def test_sliding_window_extends_expiry(client, registered_user, db_session):
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200

    new_hash = hash_refresh_token(get_refresh_cookie(client))
    row = (
        await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == new_hash)
        )
    ).scalar_one()

    expected = datetime.now(timezone.utc) + timedelta(days=30)
    assert abs((row.expires_at - expected).total_seconds()) < 60


async def test_logout(client_factory):
    device_a = client_factory()
    device_b = client_factory()
    await register_and_login(device_a)
    await register_and_login(device_b)

    r = await device_a.post("/api/auth/logout")
    assert r.status_code == 204
    assert get_refresh_cookie(device_a) is None  # cookie cleared

    # revoked: the old cookie can't refresh anymore
    r = await device_a.post("/api/auth/refresh")
    assert r.status_code == 401

    # other device unaffected
    assert (await device_b.post("/api/auth/refresh")).status_code == 200


async def test_logout_without_cookie_is_idempotent(client):
    r = await client.post("/api/auth/logout")
    assert r.status_code == 204


async def test_access_token_survives_logout(client, registered_user):
    """Documents the design: access tokens are stateless, so logout does not
    invalidate them — they simply age out within 30 minutes."""
    r = await client.post("/api/auth/logout")
    assert r.status_code == 204

    me = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {registered_user['access_token']}"},
    )
    assert me.status_code == 200

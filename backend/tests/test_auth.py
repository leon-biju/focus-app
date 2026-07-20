from tests.conftest import TEST_EMAIL, TEST_PASSWORD, register_and_login


async def test_register(client):
    r = await client.post(
        "/api/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert r.status_code == 200
    assert r.json()["email"] == TEST_EMAIL


async def test_register_duplicate_email(client):
    await register_and_login(client)
    r = await client.post(
        "/api/auth/register",
        json={"email": TEST_EMAIL, "password": "otherpassword"},
    )
    assert r.status_code == 409


async def test_login_wrong_password(client):
    await register_and_login(client)
    r = await client.post(
        "/api/auth/login",
        json={"email": TEST_EMAIL, "password": "wrong-password"},
    )
    assert r.status_code == 401
    assert "set-cookie" not in r.headers


async def test_login_returns_token_payload(client):
    await client.post(
        "/api/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    r = await client.post(
        "/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in_sec"] == 30 * 60
    assert body["access_token"]


async def test_me(client, registered_user):
    r = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {registered_user['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json()["email"] == TEST_EMAIL


async def test_me_without_token(client):
    r = await client.get("/api/auth/me")
    assert r.status_code in (401, 403)

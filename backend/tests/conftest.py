import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.db import Base, get_db
from app.main import app

ADMIN_URL = "postgresql+asyncpg://focus:focus@localhost:5432/postgres"
TEST_DB_URL = "postgresql+asyncpg://focus:focus@localhost:5432/focus_test"


@pytest.fixture(scope="session")
async def _test_db():
    # CREATE DATABASE can't run inside a transaction -> AUTOCOMMIT engine.
    admin = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    async with admin.connect() as conn:
        await conn.execute(text("DROP DATABASE IF EXISTS focus_test WITH (FORCE)"))
        await conn.execute(text("CREATE DATABASE focus_test"))
    await admin.dispose()


@pytest.fixture(scope="session")
async def engine(_test_db):
    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(engine):
    """Session wrapped in an outer connection-level transaction that is rolled
    back at teardown. join_transaction_mode="create_savepoint" turns the
    services' in-request commit() calls into savepoint releases, so they take
    effect within the test but the final rollback still wipes everything.
    """
    async with engine.connect() as conn:
        trans = await conn.begin()
        session = AsyncSession(
            bind=conn,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )
        yield session
        await session.close()
        await trans.rollback()


@pytest.fixture
async def client_factory(db_session):
    """Factory for API clients. Each AsyncClient has its own cookie jar, so a
    second client acts as a second device/browser.
    """
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    clients: list[AsyncClient] = []

    def factory() -> AsyncClient:
        c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
        clients.append(c)
        return c

    yield factory

    for c in clients:
        await c.aclose()
    app.dependency_overrides.clear()


@pytest.fixture
async def client(client_factory):
    return client_factory()


TEST_EMAIL = "user@example.com"
TEST_PASSWORD = "password123"


async def register_and_login(client: AsyncClient, email: str = TEST_EMAIL,
                             password: str = TEST_PASSWORD) -> str:
    """Register (ignoring 'already exists') and log in; returns the access token.
    Leaves the refresh cookie in the client's jar.
    """
    r = await client.post("/api/auth/register", json={"email": email, "password": password})
    assert r.status_code in (200, 409)
    r = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.fixture
async def registered_user(client):
    token = await register_and_login(client)
    return {"email": TEST_EMAIL, "password": TEST_PASSWORD, "access_token": token}

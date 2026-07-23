import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions import AppException
from app.db import engine, ping_db

from app.users import router as auth
from app.tasks import router as tasks
from app.notes import router as notes
from app.time_blocks import router as time_blocks
from app.focus_sessions import router as focus_sessions
from app.daily_logs import router as daily_logs
from app.user_settings import router as user_settings


logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ping_db()
    except Exception:
        logger.critical("Cannot reach the database. Aborting.")
        raise
    logger.info("Database connection ok")

    yield

    logger.info("Shutting down.")
    await engine.dispose()

app = FastAPI(title="Focus API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # only allow cors requests from vite!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(notes.router, prefix="/api")

@app.get("/api/health")
def health():
    return {"ok": True}

# Universal exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

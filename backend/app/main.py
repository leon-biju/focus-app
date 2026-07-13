from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, tasks, time_blocks, focus_sessions, daily_logs, user_settings

app = FastAPI(title="Focus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # only allow cors requests from vite!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")

@app.get("/api/health")
def health():
    return {"ok": True}

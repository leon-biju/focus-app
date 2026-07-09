from fastapi import APIRouter
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register():
    return


@router.post("/login")
def login():
    return
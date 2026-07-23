from typing import List
import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.users.models import User
from app.notes.schemas import NoteCreate, NoteUpdate, NoteRead
import app.notes.services as notes_services

router = APIRouter(prefix="/notes", tags=["notes"])

@router.post("")
async def create_note(
    payload: NoteCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> NoteRead:
    note = await notes_services.create(session, payload.content, user.id)
    return note

@router.get("")
async def list_notes(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> List[NoteRead]:
    notes = await notes_services.get_user_notes(session, user.id)
    return notes

@router.get("/{note_id}")
async def get_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> NoteRead:
    note = await notes_services.get(session, note_id, user.id)
    return note

@router.patch("/{note_id}")
async def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
) -> NoteRead:
    note = await notes_services.update(session, payload, note_id, user.id)
    return note

@router.delete("/{note_id}")
async def delete_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    await notes_services.delete(session, note_id, user.id)
    return Response(status_code = status.HTTP_204_NO_CONTENT)


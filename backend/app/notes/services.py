from typing import List
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.exc import StaleDataError

from app.tasks.models import Task
from app.tasks.schemas import TaskCreate
import app.tasks.services as task_services

from app.notes.models import Note
from app.notes.schemas import NoteUpdate
from app.notes.exceptions import NoteNotFoundException, NoteConflictException

async def create(
    session: AsyncSession,
    note_text: str, 
    user_id: uuid.UUID,
) -> Note:
    
    note = Note(
        user_id = user_id,
        content = note_text
    )
    session.add(note)
    await session.flush()

    return note


async def get(
    session: AsyncSession,
    note_id: uuid.UUID, 
    user_id: uuid.UUID,
) -> Note:
    result = await session.execute(
        select(Note)
        .where(
            Note.id == note_id,
            Note.user_id == user_id
        )
    )

    note = result.scalar_one_or_none()
    if note is None:
        raise NoteNotFoundException()
    
    return note


async def get_user_notes(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> List[Note]:
    result = await session.execute(
        select(Note)
        .where(Note.user_id == user_id)
        .order_by(Note.created_at.desc())
    )

    return list(result.scalars().all())


async def update(
    session: AsyncSession,
    payload: NoteUpdate,
    note_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Note:
    note = await get(session, note_id, user_id)

    if note.version_id != payload.version_id:
        # Client was relying on an older note and edited based on that. Make them reload!
        raise NoteConflictException()

    note.content = payload.content

    try:
        await session.flush()
    except StaleDataError as e:
        # Same issue as above but the other write landed after our check above.
        raise NoteConflictException() from e

    return note


async def delete(
    session: AsyncSession,
    note_id: uuid.UUID,
    user_id: uuid.UUID,
):
    note = await get(session, note_id, user_id)

    await session.delete(note)

    try:
        await session.flush()
    except StaleDataError as e:
        raise NoteConflictException() from e


async def promote_to_task(
    session: AsyncSession,
    note_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Task:
    # Create a new task then delete the note
    note = await get(session, note_id, user_id)
    task_create = TaskCreate(
        title=note.content,
        estimate_minutes=30 #TODO: No magic estimated numbers here 
    )
    task = await task_services.create(session, task_create, user_id)
    await delete(session, note_id, user_id)

    return task


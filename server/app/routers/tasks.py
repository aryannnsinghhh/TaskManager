import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.authz import get_current_user_id, require_project_approved_or_admin
from app.core.db import get_db
from app.models.entities import ProjectMember, Task
from app.models.schemas import CreateTaskPayload, UpdateTaskStatusPayload, ReassignTaskPayload

router = APIRouter()


@router.post('/')
async def create_task(payload: CreateTaskPayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await require_project_approved_or_admin(payload.projectId, user_id, db)

    approved_assignee = await db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == payload.projectId,
            ProjectMember.user_id == payload.assigneeId,
            ProjectMember.status == 'approved',
        )
    )
    if not approved_assignee:
        raise HTTPException(status_code=403, detail='Assignee is not an approved project member')

    task = Task(
        id=str(uuid.uuid4()),
        project_id=payload.projectId,
        title=payload.title,
        description=payload.description,
        status='todo',
        priority=payload.priority,
        due_date=datetime.strptime(payload.dueDate, '%Y-%m-%d').date(),
        created_at=datetime.now(),
        assignee_id=payload.assigneeId,
    )
    db.add(task)
    await db.commit()

    return {
        'task': {
            'id': task.id,
            'projectId': task.project_id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'priority': task.priority,
            'dueDate': task.due_date,
            'createdAt': task.created_at,
            'assigneeId': task.assignee_id,
        }
    }


@router.patch('/{task_id}/status')
async def update_task_status(task_id: str, payload: UpdateTaskStatusPayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    task = await db.scalar(select(Task).where(Task.id == task_id))
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')

    auth = await require_project_approved_or_admin(task.project_id, user_id, db)
    if not auth['isAdmin'] and task.assignee_id != user_id:
        raise HTTPException(status_code=403, detail='Can update only your own assigned tasks')

    task.status = payload.status
    await db.commit()
    return {'updated': True}


@router.patch('/{task_id}/assignee')
async def reassign_task(task_id: str, payload: ReassignTaskPayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    task = await db.scalar(select(Task).where(Task.id == task_id))
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')

    auth = await require_project_approved_or_admin(task.project_id, user_id, db)
    if not auth['isAdmin']:
        raise HTTPException(status_code=403, detail='Admin role required')

    approved_assignee = await db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == payload.assigneeId,
            ProjectMember.status == 'approved',
        )
    )
    if not approved_assignee:
        raise HTTPException(status_code=403, detail='Assignee is not an approved project member')

    task.assignee_id = payload.assigneeId
    await db.commit()
    return {'updated': True}


@router.delete('/{task_id}')
async def delete_task(task_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    task = await db.scalar(select(Task).where(Task.id == task_id))
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')

    auth = await require_project_approved_or_admin(task.project_id, user_id, db)
    if not auth['isAdmin']:
        raise HTTPException(status_code=403, detail='Admin role required')

    await db.delete(task)
    await db.commit()
    return {'deleted': True}

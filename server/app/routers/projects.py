import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.authz import get_current_user_id, require_org_admin, require_org_member, require_project_approved_or_admin
from app.core.db import get_db
from app.models.entities import Project, ProjectMember, ProjectInvite, User, Task, OrgMember, Organization
from app.models.schemas import CreateProjectPayload, ProjectAccessRequestPayload, UseProjectInvitePayload

router = APIRouter()


@router.get('/org/{org_id}')
async def list_org_projects(org_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await require_org_member(org_id, user_id, db)
    projects = (await db.execute(select(Project).where(Project.org_id == org_id))).scalars().all()
    memberships = (await db.execute(select(ProjectMember).where(ProjectMember.user_id == user_id))).scalars().all()
    return {
        'projects': [{'id': p.id, 'orgId': p.org_id, 'name': p.name} for p in projects],
        'accessByProject': {m.project_id: m.status for m in memberships},
    }


@router.post('/org/{org_id}')
async def create_project(org_id: str, payload: CreateProjectPayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await require_org_admin(org_id, user_id, db)
    project = Project(id=str(uuid.uuid4()), org_id=org_id, name=payload.name)
    db.add(project)
    db.add(ProjectMember(id=str(uuid.uuid4()), project_id=project.id, user_id=user_id, status='approved'))
    await db.commit()
    return {'project': {'id': project.id, 'orgId': project.org_id, 'name': project.name}}


@router.post('/request-access')
async def request_project_access(payload: ProjectAccessRequestPayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    project = await db.scalar(select(Project).where(Project.id == payload.projectId))
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    await require_org_member(project.org_id, user_id, db)
    existing = await db.scalar(
        select(ProjectMember).where(ProjectMember.project_id == payload.projectId, ProjectMember.user_id == user_id)
    )
    if not existing:
        db.add(ProjectMember(id=str(uuid.uuid4()), project_id=payload.projectId, user_id=user_id, status='pending'))
    elif existing.status == 'rejected':
        existing.status = 'pending'
    await db.commit()
    return {'requested': True}


@router.post('/use-code')
async def use_project_invite_code(payload: UseProjectInvitePayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    invite = await db.scalar(select(ProjectInvite).where(ProjectInvite.code == payload.code, ProjectInvite.status == 'active'))
    if not invite:
        raise HTTPException(status_code=400, detail='This invite code is invalid or has already been used.')

    project = await db.scalar(select(Project).where(Project.id == invite.project_id))
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')

    org = await db.scalar(select(Organization).where(Organization.id == project.org_id))

    existing_org_member = await db.scalar(
        select(OrgMember).where(OrgMember.org_id == project.org_id, OrgMember.user_id == user_id)
    )
    if not existing_org_member:
        db.add(OrgMember(id=str(uuid.uuid4()), org_id=project.org_id, user_id=user_id, role='member'))
        await db.flush()

    existing_project_member = await db.scalar(
        select(ProjectMember).where(ProjectMember.project_id == invite.project_id, ProjectMember.user_id == user_id)
    )
    if not existing_project_member:
        db.add(ProjectMember(id=str(uuid.uuid4()), project_id=invite.project_id, user_id=user_id, status='pending'))
    elif existing_project_member.status == 'rejected':
        existing_project_member.status = 'pending'

    invite.status = 'used'
    await db.commit()

    return {
        'organization': {'id': org.id, 'name': org.name, 'inviteCode': org.invite_code},
        'projectId': invite.project_id,
        'status': 'pending'
    }


@router.post('/{project_id}/generate-code')
async def generate_project_invite_code(project_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    await require_org_admin(project.org_id, user_id, db)
    code = secrets.token_hex(8).upper()
    invite = ProjectInvite(id=str(uuid.uuid4()), project_id=project_id, code=code, status='active')
    db.add(invite)
    await db.commit()
    return {'code': code, 'projectId': project_id}


@router.delete('/{project_id}')
async def delete_project(project_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    await require_org_admin(project.org_id, user_id, db)
    await db.execute(delete(Task).where(Task.project_id == project_id))
    await db.execute(delete(ProjectMember).where(ProjectMember.project_id == project_id))
    await db.execute(delete(ProjectInvite).where(ProjectInvite.project_id == project_id))
    await db.delete(project)
    await db.commit()
    return {'deleted': True}


@router.get('/{project_id}/board')
async def get_project_board(project_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await require_project_approved_or_admin(project_id, user_id, db)
    tasks = (await db.execute(select(Task).where(Task.project_id == project_id))).scalars().all()
    approved = (await db.execute(select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.status == 'approved'))).scalars().all()
    user_ids = [m.user_id for m in approved]
    users = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all() if user_ids else []
    invite = await db.scalar(select(ProjectInvite).where(ProjectInvite.project_id == project_id, ProjectInvite.status == 'active'))

    return {
        'tasks': [
            {
                'id': t.id,
                'projectId': t.project_id,
                'title': t.title,
                'description': t.description,
                'status': t.status,
                'priority': t.priority,
                'dueDate': str(t.due_date) if t.due_date else None,
                'createdAt': str(t.created_at) if t.created_at else None,
                'assigneeId': t.assignee_id,
            }
            for t in tasks
        ],
        'approvedMembers': [{'id': u.id, 'name': u.full_name, 'email': u.email} for u in users],
        'inviteCode': invite.code if invite else None,
    }
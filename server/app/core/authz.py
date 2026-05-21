import os
from fastapi import Header, HTTPException
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import OrgMember, Project, ProjectMember

_SECRET = os.getenv('JWT_SECRET', 'change-me-in-production')
_ALGO = 'HS256'

async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing or invalid Authorization header')
    token = authorization.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, _SECRET, algorithms=[_ALGO])
        user_id: str = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid token')
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid or expired token')

async def require_org_member(org_id: str, user_id: str, db: AsyncSession) -> OrgMember:
    row = await db.scalar(select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == user_id))
    if not row:
        raise HTTPException(status_code=403, detail='User is not part of this organisation')
    return row

async def require_org_admin(org_id: str, user_id: str, db: AsyncSession) -> None:
    member = await require_org_member(org_id, user_id, db)
    if member.role != 'admin':
        raise HTTPException(status_code=403, detail='Admin role required')

async def require_project_approved_or_admin(project_id: str, user_id: str, db: AsyncSession) -> dict:
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    org_member = await db.scalar(
        select(OrgMember).where(OrgMember.org_id == project.org_id, OrgMember.user_id == user_id)
    )
    if org_member and org_member.role == 'admin':
        return {'project': project, 'isAdmin': True}
    approved = await db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
            ProjectMember.status == 'approved',
        )
    )
    if not approved:
        raise HTTPException(status_code=403, detail='Approved project membership required')
    return {'project': project, 'isAdmin': False}
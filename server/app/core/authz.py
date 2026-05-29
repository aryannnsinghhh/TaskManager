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

# bottom of server/app/core/authz.py

from sqlalchemy import select  # already imported above, just noting it
from app.models.entities import ProjectMember, Project  # already imported above

def get_ws_user_id(t: str) -> str:
    """
    Validates a JWT passed as a query param on WebSocket connections.
    Returns user_id string if valid, raises ValueError if not.
    """
    try:
        payload = jwt.decode(t, _SECRET, algorithms=[_ALGO])
        user_id: str = payload.get("sub")
        if not user_id:
            raise ValueError("No subject in token")
        return user_id
    except JWTError:
        raise ValueError("Invalid or expired token")


async def ws_get_project_room(
    t: str,
    project_id: str,
    db: AsyncSession,
) -> tuple[str, str]:
    """
    Validates token + project membership for a WebSocket connection.
    Returns (user_id, room_name) if authorized.
    Raises ValueError with a reason string if not.
    """
    user_id = get_ws_user_id(t)

    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise ValueError("Project not found")

    from app.models.entities import OrgMember
    org_member = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == project.org_id,
            OrgMember.user_id == user_id,
        )
    )
    is_admin = org_member and org_member.role == "admin"

    if not is_admin:
        approved = await db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
                ProjectMember.status == "approved",
            )
        )
        if not approved:
            raise ValueError("Not a member of this project")

    return user_id, f"project:{project_id}"


async def ws_get_user_room(t: str) -> tuple[str, str]:
    """
    Validates token for a personal notification channel.
    Returns (user_id, room_name).
    """
    user_id = get_ws_user_id(t)
    return user_id, f"user:{user_id}"


async def ws_get_org_room(
    t: str,
    org_id: str,
    db: AsyncSession,
) -> tuple[str, str]:
    """
    Validates token + org admin role for the org notification channel.
    Returns (user_id, room_name).
    """
    user_id = get_ws_user_id(t)

    from app.models.entities import OrgMember
    org_member = await db.scalar(
        select(OrgMember).where(
            OrgMember.org_id == org_id,
            OrgMember.user_id == user_id,
        )
    )
    if not org_member or org_member.role != "admin":
        raise ValueError("Admin role required")

    return user_id, f"org:{org_id}"

# Why separate from get_current_user_id: The existing function is a FastAPI dependency that reads from the Header. WebSocket handlers can't use that — query params only. So we have a parallel function that does the same JWT decode but reads from the t string directly. The crypto logic is identical.
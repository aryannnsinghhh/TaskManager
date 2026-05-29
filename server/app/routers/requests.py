from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.authz import get_current_user_id, require_org_admin
from app.core.db import get_db
from app.core.ws import manager
from app.models.entities import ProjectMember, Project, User
from app.models.schemas import AccessDecisionPayload

router = APIRouter()


@router.get('/org/{org_id}')
async def get_org_access_requests(
    org_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await require_org_admin(org_id, user_id, db)
    projects = (await db.execute(select(Project).where(Project.org_id == org_id))).scalars().all()
    project_ids = [p.id for p in projects]
    if not project_ids:
        return {'requests': []}

    pending = (await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id.in_(project_ids),
            ProjectMember.status == 'pending',
        )
    )).scalars().all()

    user_ids = [m.user_id for m in pending]
    users = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all() if user_ids else []
    user_map = {u.id: u for u in users}
    project_map = {p.id: p.name for p in projects}

    return {
        'requests': [
            {
                'projectId': m.project_id,
                'projectName': project_map.get(m.project_id, ''),
                'userId': m.user_id,
                'userName': user_map[m.user_id].full_name if m.user_id in user_map else '',
                'userEmail': user_map[m.user_id].email if m.user_id in user_map else '',
            }
            for m in pending if m.user_id in user_map
        ]
    }


@router.post('/decision')
async def decide_access_request(
    payload: AccessDecisionPayload,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    project = await db.scalar(select(Project).where(Project.id == payload.projectId))
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')

    await require_org_admin(project.org_id, user_id, db)

    member = await db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == payload.projectId,
            ProjectMember.user_id == payload.userId,
        )
    )
    if not member:
        raise HTTPException(status_code=404, detail='Request not found')

    member.status = payload.status
    await db.commit()

    # notify the affected member on their personal channel
    await manager.broadcast(
        f'user:{payload.userId}',
        {
            'type': 'request_decided',
            'payload': {
                'projectId': payload.projectId,
                'projectName': project.name,
                'status': payload.status,  # 'approved' or 'rejected'
            },
        },
    )

    # notify admins on the org channel
    await manager.broadcast(
        f'org:{project.org_id}',
        {
            'type': 'request_decided',
            'payload': {
                'projectId': payload.projectId,
                'projectName': project.name,
                'userId': payload.userId,
                'status': payload.status,
            },
        },
    )

    return {'updated': True}
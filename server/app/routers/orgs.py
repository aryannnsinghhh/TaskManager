import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.authz import get_current_user_id, require_org_admin
from app.core.db import get_db
from app.models.entities import Organization, OrgMember, Project, ProjectMember, User
from app.models.schemas import CreateOrgPayload, JoinOrgPayload, InvitePayload

router = APIRouter()


def _make_invite_code(name: str) -> str:
    cleaned = ''.join(ch for ch in name if ch.isalnum()).upper()[:10] or 'ORG'
    return f'{cleaned}-{uuid.uuid4().hex[:4].upper()}'


@router.get('/')
async def list_user_orgs(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    memberships = (await db.execute(select(OrgMember).where(OrgMember.user_id == user_id))).scalars().all()
    org_ids = [m.org_id for m in memberships]
    orgs = (await db.execute(select(Organization).where(Organization.id.in_(org_ids)))).scalars().all() if org_ids else []
    return {
        'organizations': [
            {'id': org.id, 'name': org.name, 'inviteCode': org.invite_code}
            for org in orgs
        ],
        'roleByOrg': {m.org_id: m.role for m in memberships},
    }


@router.post('/create')
async def create_org(payload: CreateOrgPayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    org = Organization(id=str(uuid.uuid4()), name=payload.name, invite_code=_make_invite_code(payload.name))
    db.add(org)
    await db.flush()

    project = Project(id=str(uuid.uuid4()), org_id=org.id, name='Launch Board')
    db.add(project)
    await db.flush()

    db.add_all([
        OrgMember(id=str(uuid.uuid4()), org_id=org.id, user_id=user_id, role='admin'),
        ProjectMember(id=str(uuid.uuid4()), project_id=project.id, user_id=user_id, status='approved'),
    ])
    await db.commit()
    return {'organization': {'id': org.id, 'name': org.name, 'inviteCode': org.invite_code}}


@router.post('/join')
async def join_org_by_invite(payload: JoinOrgPayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    org = await db.scalar(select(Organization).where(Organization.invite_code == payload.inviteCode.strip()))
    if not org:
        raise HTTPException(status_code=404, detail='Invite code not found')

    exists = await db.scalar(select(OrgMember).where(OrgMember.org_id == org.id, OrgMember.user_id == user_id))
    if not exists:
        db.add(OrgMember(id=str(uuid.uuid4()), org_id=org.id, user_id=user_id, role='member'))
        await db.commit()
    return {'organization': {'id': org.id, 'name': org.name, 'inviteCode': org.invite_code}}


@router.post('/{org_id}/invite')
async def invite_to_org(org_id: str, payload: InvitePayload, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await require_org_admin(org_id, user_id, db)

    invited = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if not invited:
        invited = User(id=str(uuid.uuid4()), full_name=payload.email.split('@')[0], email=payload.email.lower())
        db.add(invited)
        await db.flush()

    existing = await db.scalar(select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == invited.id))
    if not existing:
        db.add(OrgMember(id=str(uuid.uuid4()), org_id=org_id, user_id=invited.id, role='member'))

    await db.commit()
    return {'invitedUser': {'id': invited.id, 'full_name': invited.full_name, 'email': invited.email}}

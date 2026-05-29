import os
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.entities import OrgMember, User
from app.models.schemas import LoginPayload, SignupPayload
from app.core.authz import get_current_user_id

router = APIRouter()

_pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')
_SECRET = os.getenv('JWT_SECRET', 'change-me-in-production')
_ALGO = 'HS256'
_TTL_DAYS = 30


def _hash(password: str) -> str:
    return _pwd.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def _make_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=_TTL_DAYS)
    return jwt.encode({'sub': user_id, 'exp': exp}, _SECRET, algorithm=_ALGO)


def _user_out(user: User) -> dict:
    return {'id': user.id, 'full_name': user.full_name, 'email': user.email}


@router.post('/signup')
async def signup(payload: SignupPayload, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail='An account with this email already exists.')

    user = User(
        id=str(uuid.uuid4()),
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        password_hash=_hash(payload.password),
    )
    db.add(user)
    await db.commit()

    return {'token': _make_token(user.id), 'user': _user_out(user)}


@router.post('/login')
async def login(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not _verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid email or password.')

    memberships = (await db.execute(select(OrgMember).where(OrgMember.user_id == user.id))).scalars().all()
    return {
        'token': _make_token(user.id),
        'user': _user_out(user),
        'orgMemberships': [{'orgId': m.org_id, 'userId': m.user_id, 'role': m.role} for m in memberships],
    }

@router.get('/me')
async def get_me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    memberships = (await db.execute(select(OrgMember).where(OrgMember.user_id == user_id))).scalars().all()
    return {
        'user': _user_out(user),
        'orgMemberships': [{'orgId': m.org_id, 'userId': m.user_id, 'role': m.role} for m in memberships],
    }
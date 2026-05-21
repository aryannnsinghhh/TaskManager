import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, UniqueConstraint, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class User(Base):
    __tablename__ = 'users'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), default='')


class Organization(Base):
    __tablename__ = 'organizations'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(160))
    invite_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)


class OrgMember(Base):
    __tablename__ = 'org_members'
    __table_args__ = (UniqueConstraint('user_id', 'org_id', name='uq_org_member'),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    org_id: Mapped[str] = mapped_column(ForeignKey('organizations.id', ondelete='CASCADE'), index=True)
    role: Mapped[str] = mapped_column(String(16))


class Project(Base):
    __tablename__ = 'projects'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(ForeignKey('organizations.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(160))


class ProjectMember(Base):
    __tablename__ = 'project_members'
    __table_args__ = (UniqueConstraint('user_id', 'project_id', name='uq_project_member'),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    project_id: Mapped[str] = mapped_column(ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    status: Mapped[str] = mapped_column(String(16), index=True)


class ProjectInvite(Base):
    __tablename__ = 'project_invites'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(16), default='active')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Task(Base):
    __tablename__ = 'tasks'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    title: Mapped[str] = mapped_column(String(220))
    description: Mapped[str] = mapped_column(String(2000), default='')
    status: Mapped[str] = mapped_column(String(16), index=True)
    priority: Mapped[str] = mapped_column(String(16))
    due_date: Mapped[Date] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sort_order: Mapped[int] = mapped_column(default=0)
    assignee_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)

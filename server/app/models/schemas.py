from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class SignupPayload(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class CreateOrgPayload(BaseModel):
    name: str = Field(min_length=2)


class JoinOrgPayload(BaseModel):
    inviteCode: str = Field(min_length=3)


class InvitePayload(BaseModel):
    email: EmailStr


class CreateProjectPayload(BaseModel):
    name: str = Field(min_length=2)


class ProjectAccessRequestPayload(BaseModel):
    projectId: str


class UseProjectInvitePayload(BaseModel):
    code: str = Field(min_length=16, max_length=16)


class AccessDecisionPayload(BaseModel):
    projectId: str
    userId: str
    status: Literal['approved', 'rejected']


class CreateTaskPayload(BaseModel):
    projectId: str
    title: str = Field(min_length=2)
    description: str = ''
    priority: Literal['High', 'Medium', 'Low']
    dueDate: str
    assigneeId: str


class UpdateTaskStatusPayload(BaseModel):
    status: Literal['todo', 'inprogress', 'done']


class ReassignTaskPayload(BaseModel):
    assigneeId: str

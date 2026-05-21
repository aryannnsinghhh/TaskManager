# TaskNexus Backend (FastAPI + PostgreSQL)

## Stack
- FastAPI
- SQLAlchemy 2.x (async)
- asyncpg
- Alembic (migration tool)

## Environment
Set `DATABASE_URL`:

`postgresql://postgres.fvjdaojvflbrqdyhwoec:<YOUR_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`

The backend auto-converts `postgresql://` to `postgresql+asyncpg://` internally.

## Install
```bash
pip install -r requirements.txt
```

## Run
```bash
uvicorn main:app --reload --port 8000
```
Run from `server/`.

## Temporary auth for local integration
Pass header:
- `x-user-id: <user-id>`

## RBAC enforcement
Project APIs enforce access on the backend:
- org admin OR approved `ProjectMember`
- members can update status only for their assigned tasks
- assignees must be approved project members

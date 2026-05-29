from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.db import init_db, close_db
from app.routers import auth, orgs, projects, tasks, requests, ws as ws_router

from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer

security = HTTPBearer()

app = FastAPI(title='TeamTaskManager API', version='0.2.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'https://the-all-new-task-manager.vercel.app',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
async def startup_event() -> None:
    await init_db()


@app.on_event('shutdown')
async def shutdown_event() -> None:
    await close_db()


app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(orgs.router, prefix='/api/orgs', tags=['orgs'])
app.include_router(projects.router, prefix='/api/projects', tags=['projects'])
app.include_router(tasks.router, prefix='/api/tasks', tags=['tasks'])
app.include_router(requests.router, prefix='/api/requests', tags=['requests'])
app.include_router(ws_router.router, prefix="/ws")


@app.get('/api/health')
async def health() -> dict:
    return {'ok': True}

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
    schema['components']['securitySchemes'] = {
        'BearerAuth': {'type': 'http', 'scheme': 'bearer'}
    }
    for path in schema['paths'].values():
        for method in path.values():
            method['security'] = [{'BearerAuth': []}]
    app.openapi_schema = schema
    return schema

app.openapi_schema = None
app.openapi = custom_openapi
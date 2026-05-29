# server/app/routers/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.ws import manager
from app.core.authz import ws_get_project_room, ws_get_user_room, ws_get_org_room

router = APIRouter()


@router.websocket("/project/{project_id}")
async def ws_project(
    project_id: str,
    ws: WebSocket,
    t: str = Query(...),  # the JWT from ?t=...
    db: AsyncSession = Depends(get_db),
):
    # 1. Authenticate + authorize before accepting
    try:
        user_id, room = await ws_get_project_room(t, project_id, db)
    except ValueError as e:
        await ws.close(code=4001)
        return

    # 2. Accept and register in the room
    await manager.connect(room, ws)

    # 3. Keep the connection alive, waiting for disconnect
    try:
        while True:
            # We don't expect messages from the client,
            # but we must await something or the coroutine exits immediately.
            # receive_text() blocks until the client sends data or disconnects.
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room, ws)


@router.websocket("/user")
async def ws_user(
    ws: WebSocket,
    t: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id, room = await ws_get_user_room(t)
    except ValueError:
        await ws.close(code=4001)
        return

    await manager.connect(room, ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room, ws)


@router.websocket("/org/{org_id}")
async def ws_org(
    org_id: str,
    ws: WebSocket,
    t: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id, room = await ws_get_org_room(t, org_id, db)
    except ValueError:
        await ws.close(code=4001)
        return

    await manager.connect(room, ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room, ws)

# Why the while True loop: A WebSocket endpoint in FastAPI is an async function. If it returns, the connection closes. We need it to stay open indefinitely. receive_text() is a blocking await — it suspends the coroutine and gives the event loop back to FastAPI to handle other requests. When the client disconnects, receive_text() raises WebSocketDisconnect, we catch it, clean up, and the function exits naturally. This is the standard FastAPI WebSocket pattern.
# server/app/core/ws.py
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # rooms is a dict where:
        #   key   = room name, e.g. "project:abc" or "user:xyz" or "org:org1"
        #   value = a set of WebSocket objects currently connected to that room
        self.rooms: dict[str, set[WebSocket]] = {}

    async def connect(self, room: str, ws: WebSocket):
        await ws.accept()
        if room not in self.rooms:
            self.rooms[room] = set()
        self.rooms[room].add(ws)
        logger.info(f"WS connected: room={room}, total={len(self.rooms[room])}")

    def disconnect(self, room: str, ws: WebSocket):
        if room in self.rooms:
            self.rooms[room].discard(ws)
            if not self.rooms[room]:
                del self.rooms[room]  # clean up empty rooms
        logger.info(f"WS disconnected: room={room}")

    async def broadcast(self, room: str, event: dict):
        if room not in self.rooms:
            return
        dead: set[WebSocket] = set()
        for ws in self.rooms[room]:
            try:
                await ws.send_json(event)
            except Exception:
                # connection is broken, mark for removal
                dead.add(ws)
        for ws in dead:
            self.disconnect(room, ws)


# single instance, lives for the lifetime of the process
manager = ConnectionManager()

# What's happening here:
# self.rooms is a Python dictionary. Think of it as a whiteboard where each row is a room name and next to it is a list of everyone currently in that room:
# "project:abc"  →  {ws_tab1, ws_tab2}
# "user:xyz"     →  {ws_tab3}
# "org:org1"     →  {ws_tab4}
# connect() — when a user opens the board, their WebSocket gets added to the correct room.
# disconnect() — when they close the tab or lose connection, they're removed. If the room becomes empty, we delete it so memory doesn't accumulate.
# broadcast() — when a task event happens, loop through every WebSocket in that room and send them the JSON event. If any connection is already dead (broken pipe, tab closed without a clean disconnect), sending to it throws an exception — we catch that, mark it as dead, and clean it up afterward. We don't remove during the loop because you can't modify a set while iterating it.
# manager at the bottom is the single instance. It's imported by both the WS router and the task/request routers. Because Python modules are singletons, they all share the exact same object and therefore the exact same rooms dict. This way, when a task event happens in the task router, it can call manager.broadcast() and it will send to all WebSockets currently connected to that room, even though those WebSockets were created in a completely different part of the code.
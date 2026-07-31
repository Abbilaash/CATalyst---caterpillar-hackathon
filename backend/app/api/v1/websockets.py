from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps asset_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Also need a way to broadcast to ALL machines (for Dealer Fleet view)
        self.fleet_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, asset_id: str = None):
        await websocket.accept()
        if asset_id:
            if asset_id not in self.active_connections:
                self.active_connections[asset_id] = []
            self.active_connections[asset_id].append(websocket)
        else:
            self.fleet_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, asset_id: str = None):
        if asset_id:
            if asset_id in self.active_connections:
                try:
                    self.active_connections[asset_id].remove(websocket)
                except ValueError:
                    pass
                if not self.active_connections[asset_id]:
                    del self.active_connections[asset_id]
        else:
            try:
                self.fleet_connections.remove(websocket)
            except ValueError:
                pass

    async def broadcast_to_asset(self, asset_id: str, message: dict):
        # Send to specific asset listeners (Operators)
        if asset_id in self.active_connections:
            for connection in self.active_connections[asset_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass
        
        # Also send to fleet listeners (Dealers)
        for connection in self.fleet_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/telemetry")
async def websocket_fleet_endpoint(websocket: WebSocket):
    """WebSocket for Dealers (all fleet data)"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text() # keep-alive or ping
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/telemetry/{asset_id}")
async def websocket_asset_endpoint(websocket: WebSocket, asset_id: str):
    """WebSocket for Operators (specific machine)"""
    await manager.connect(websocket, asset_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, asset_id)

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.postgres import get_db
from app.models.postgres.core import Asset, Rental
from pydantic import BaseModel
import random
from datetime import datetime

router = APIRouter()

class MapMarker(BaseModel):
    id: str
    x: int
    y: int
    status: str
    label: str
    site: str

class ActivityEvent(BaseModel):
    id: str
    type: str
    title: str
    detail: str
    time: str

@router.get("/map-markers", response_model=list[MapMarker])
async def get_map_markers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset))
    assets = result.scalars().all()
    
    markers = []
    for asset in assets:
        ui_status = "working" if asset.current_status == "rented" else "idle"
        markers.append(MapMarker(
            id=f"m-{asset.asset_id}",
            x=random.randint(20, 80),
            y=random.randint(20, 80),
            status=ui_status,
            label=asset.asset_name,
            site="Dealer Yard" # Hardcoded for now
        ))
    return markers

@router.get("/activity", response_model=list[ActivityEvent])
async def get_activity():
    # Return some mock activity timeline for demo purposes
    return [
        ActivityEvent(
            id="act-1",
            type="start",
            title="System Online",
            detail="Tracking active for all CAT machinery",
            time="Just now"
        ),
        ActivityEvent(
            id="act-2",
            type="ai",
            title="AI Optimization",
            detail="Calculated demand forecasts for next 7 days",
            time="5 min ago"
        )
    ]

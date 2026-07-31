from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc
from app.db.postgres import get_db
from app.models.postgres.core import Asset, Rental, Site, Assignment
from app.models.postgres.telemetry import Telemetry, EngineEvent
from pydantic import BaseModel
from datetime import datetime, timedelta

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
    
    # Bulk fetch sites
    site_result = await db.execute(select(Site))
    sites_map = {s.site_id: s.site_name for s in site_result.scalars().all()}
    
    # Bulk fetch latest telemetry
    yesterday = datetime.utcnow() - timedelta(days=1)
    tel_res = await db.execute(select(Telemetry).where(Telemetry.timestamp >= yesterday))
    recent_tels = tel_res.scalars().all()
    
    tel_latest_map = {}
    for t in recent_tels:
        if t.asset_id not in tel_latest_map or t.timestamp > tel_latest_map[t.asset_id].timestamp:
            tel_latest_map[t.asset_id] = t
            
    # Bulk fetch active assignments to find site for each asset
    assign_res = await db.execute(select(Assignment).where(Assignment.assignment_status.in_(['active', 'scheduled'])))
    assign_map = {a.asset_id: a for a in assign_res.scalars().all()}

    markers = []
    for asset in assets:
        ui_status = "idle"
        if asset.current_status == "rented":
            ui_status = "working"
        elif asset.current_status == "maintenance":
            ui_status = "maintenance"
            
        assign = assign_map.get(asset.asset_id)
        site_name = sites_map.get(assign.site_id, "Dealer Yard") if assign and assign.site_id else "Dealer Yard"
                
        tel = tel_latest_map.get(asset.asset_id)
        
        lat = tel.latitude if tel and tel.latitude else 40.7
        lon = tel.longitude if tel and tel.longitude else -73.9
        
        x_pct = int(((lon - (-74.1)) / 0.4) * 100)
        y_pct = 100 - int(((lat - 40.5) / 0.4) * 100)
        
        x_pct = max(5, min(95, x_pct))
        y_pct = max(5, min(95, y_pct))

        markers.append(MapMarker(
            id=f"m-{asset.asset_id}",
            x=x_pct,
            y=y_pct,
            status=ui_status,
            label=asset.asset_name,
            site=site_name
        ))
    return markers

def time_ago(dt: datetime) -> str:
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    diff = datetime.utcnow() - dt
    if diff.days > 0:
        return f"{diff.days}d ago"
    hours = diff.seconds // 3600
    if hours > 0:
        return f"{hours}h ago"
    mins = diff.seconds // 60
    if mins > 0:
        return f"{mins}m ago"
    return "Just now"

@router.get("/activity", response_model=list[ActivityEvent])
async def get_activity(db: AsyncSession = Depends(get_db)):
    events = []
    
    # 1. Recent Engine Events
    e_res = await db.execute(select(EngineEvent).order_by(desc(EngineEvent.timestamp)).limit(5))
    for evt in e_res.scalars().all():
        events.append(ActivityEvent(
            id=f"evt-{evt.event_id}",
            type="maintenance" if evt.severity == "critical" else "alert",
            title=f"Engine {evt.event_type}",
            detail=f"{evt.event_value} ({evt.severity}) on asset",
            time=time_ago(evt.timestamp)
        ))
        
    # 2. Recent Rentals (approximating with check_in_time)
    r_res = await db.execute(select(Rental).order_by(desc(Rental.check_in_time)).limit(5))
    for r in r_res.scalars().all():
        if r.check_in_time:
            events.append(ActivityEvent(
                id=f"ren-{r.rental_id}",
                type="start",
                title="Rental Started",
                detail=f"Manager {r.assigned_site_manager} checked out asset",
                time=time_ago(r.check_in_time)
            ))

    # We could sort them if we preserved the raw datetime, but this is sufficient for the timeline
    return events[:8]

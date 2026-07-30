from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc
from app.db.postgres import get_db
from app.models.postgres.core import Asset, Site, Rental, Assignment
from app.models.postgres.telemetry import Telemetry
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

# Schema for frontend
class EquipmentUIResponse(BaseModel):
    id: str
    name: str
    model: str
    category: str
    image: str
    site: str
    operator: str
    health: int
    engineHours: int
    idleHours: int
    rentalRemainingDays: int
    status: str
    riskScore: int

@router.get("", response_model=list[EquipmentUIResponse])
async def get_all_equipment(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset))
    assets = result.scalars().all()
    
    # Bulk fetch sites
    site_result = await db.execute(select(Site))
    sites_map = {s.site_id: s.site_name for s in site_result.scalars().all()}
    
    # Bulk fetch active assignments (used instead of rentals since rentals table may be empty)
    assign_res = await db.execute(select(Assignment).where(Assignment.assignment_status.in_(['active', 'scheduled'])))
    active_assigns = assign_res.scalars().all()
    assign_map = {}  # asset_id -> Assignment
    for a in active_assigns:
        assign_map[a.asset_id] = a
    
    # Bulk fetch latest telemetry (using a distinct on or just fetching recent)
    # Since we don't have distinct in generic SA easily, we'll fetch last 24h of telemetry and group in memory
    yesterday = datetime.utcnow() - timedelta(days=1)
    tel_res = await db.execute(select(Telemetry).where(Telemetry.timestamp >= yesterday))
    recent_tels = tel_res.scalars().all()
    
    tel_latest_map = {}
    tel_idle_map = {}
    
    for t in recent_tels:
        # Latest telemetry for health/engine hours
        if t.asset_id not in tel_latest_map or t.timestamp > tel_latest_map[t.asset_id].timestamp:
            tel_latest_map[t.asset_id] = t
        
        # Sum idle hours
        tel_idle_map[t.asset_id] = tel_idle_map.get(t.asset_id, 0) + (t.idle_hours or 0)
    
    response_data = []
    now = datetime.utcnow()
    
    for asset in assets:
        # Get site name from active assignment instead of asset.current_site_id
        assign = assign_map.get(asset.asset_id)
        site_name = sites_map.get(assign.site_id, "Dealer Yard") if assign and assign.site_id else "Dealer Yard"
                
        ui_status = "idle"
        if asset.current_status == "rented":
            ui_status = "working"
        elif asset.current_status == "maintenance":
            ui_status = "maintenance"
            
        operator_name = "Unassigned"
        rental_days = 0
        if assign:
            operator_name = assign.operator_id or "Unknown"
            if assign.end_time:
                rental_days = max(0, (assign.end_time - now).days)

        tel = tel_latest_map.get(asset.asset_id)
        
        health = 100
        engine_hours = int(asset.total_engine_hours or 0)
        idle_hours = int(tel_idle_map.get(asset.asset_id, 0))
        
        if tel:
            engine_hours = int(tel.engine_hours or engine_hours)
            volts = tel.battery_voltage or 14.0
            health = min(100, max(0, int((volts / 14.0) * 100)))

        riskScore = max(0, 100 - health)
        
        eq = EquipmentUIResponse(
            id=asset.asset_id,
            name=asset.asset_name,
            model=asset.model or "Unknown",
            category=asset.equipment_type or "Excavator",
            image=asset.image_url or "https://images.unsplash.com/photo-1581094288338-2314dddb7a14?w=800&q=80",
            site=site_name,
            operator=operator_name,
            health=health,
            engineHours=engine_hours,
            idleHours=idle_hours,
            rentalRemainingDays=rental_days,
            status=ui_status,
            riskScore=riskScore
        )
        response_data.append(eq)
        
    return response_data
        
from app.models.postgres.core import Asset, Site, Rental, MaintenanceLog

class MaintenanceLogResponse(BaseModel):
    id: str
    date: str
    event: str
    status: str
    remarks: str | None = None

@router.get("/{asset_id}/maintenance", response_model=list[MaintenanceLogResponse])
async def get_maintenance_logs(asset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MaintenanceLog).where(MaintenanceLog.asset_id == asset_id).order_by(desc(MaintenanceLog.date))
    )
    logs = result.scalars().all()
    
    return [
        MaintenanceLogResponse(
            id=log.log_id,
            date=log.date.strftime("%b %d"),
            event=log.event,
            status=log.status,
            remarks=log.remarks
        )
        for log in logs
    ]

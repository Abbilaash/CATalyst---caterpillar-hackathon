from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.postgres import get_db
from app.models.postgres.core import Asset, Site, Assignment
from pydantic import BaseModel
import random

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
    
    response_data = []
    for asset in assets:
        # Get site name if available
        site_name = "Dealer Yard"
        if asset.current_site_id:
            site_result = await db.execute(select(Site).where(Site.site_id == asset.current_site_id))
            site = site_result.scalar_one_or_none()
            if site:
                site_name = site.site_name
                
        # Get active operator if available
        operator_name = "Unassigned"
        
        # Determine status string the UI expects: 'working', 'idle', 'critical', 'maintenance', 'transit'
        ui_status = "idle"
        if asset.current_status == "rented":
            ui_status = "working"
        elif asset.current_status == "maintenance":
            ui_status = "maintenance"
            
        # Mock some metrics since telemetry table isn't populated with real data yet
        health = random.randint(60, 100)
        riskScore = 100 - health
        idleHours = random.randint(0, 20) if ui_status != "working" else 0
        
        eq = EquipmentUIResponse(
            id=asset.asset_id,
            name=asset.asset_name,
            model=asset.model or "Unknown",
            category=asset.equipment_type or "Excavator",
            image=asset.image_url or "https://images.unsplash.com/photo-1581094288338-2314dddb7a14?w=800&q=80",
            site=site_name,
            operator=operator_name,
            health=health,
            engineHours=int(asset.total_engine_hours or 0),
            idleHours=idleHours,
            rentalRemainingDays=random.randint(1, 30), # Mocked for now
            status=ui_status,
            riskScore=riskScore
        )
        response_data.append(eq)
        
    return response_data

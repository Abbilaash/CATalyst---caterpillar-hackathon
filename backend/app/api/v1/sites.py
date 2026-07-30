from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.postgres import get_db
from app.models.postgres.core import Site, Asset
from pydantic import BaseModel
import random

router = APIRouter()

class SiteUIResponse(BaseModel):
    id: str
    name: str
    location: str
    machines: int
    operators: int
    utilization: int
    upcomingDemand: str
    weather: str
    weatherTemp: int
    riskLevel: str
    aiAction: str

@router.get("", response_model=list[SiteUIResponse])
async def get_all_sites(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site))
    sites = result.scalars().all()
    
    response_data = []
    weather_options = ["Sunny", "Partly Cloudy", "Rain", "Overcast"]
    
    for site in sites:
        # Count machines at this site
        asset_res = await db.execute(select(func.count(Asset.asset_id)).where(Asset.current_site_id == site.site_id))
        machine_count = asset_res.scalar() or 0
        
        # Mocking operators as 80% of machines for now
        operators_count = int(machine_count * 0.8)
        
        response_data.append(
            SiteUIResponse(
                id=site.site_id,
                name=site.site_name,
                location=site.location,
                machines=machine_count,
                operators=operators_count,
                utilization=random.randint(60, 95),
                upcomingDemand=f"Excavator +{random.randint(1, 3)}",
                weather=random.choice(weather_options),
                weatherTemp=random.randint(50, 100),
                riskLevel=random.choice(["Low", "Medium", "High"]),
                aiAction="Maintain current allocation. Next review in 48h."
            )
        )
        
    return response_data

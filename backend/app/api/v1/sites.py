from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, and_
from app.db.postgres import get_db
from app.models.postgres.core import Site, Asset, Rental, RentalRequest
from pydantic import BaseModel

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
    
    for site in sites:
        # Count total machines at this site
        asset_res = await db.execute(select(func.count(Asset.asset_id)).where(Asset.current_site_id == site.site_id))
        machine_count = asset_res.scalar() or 0
        
        # Count active rentals at this site
        active_rentals_res = await db.execute(
            select(func.count(Rental.rental_id))
            .join(Asset)
            .where(
                and_(Asset.current_site_id == site.site_id, Rental.rental_status == 'active')
            )
        )
        active_rentals = active_rentals_res.scalar() or 0
        
        utilization = 0
        if machine_count > 0:
            utilization = int((active_rentals / machine_count) * 100)

        # Count operators (distinct operators on active rentals at site)
        # Using a simple subquery or just counting rentals since 1 rental = 1 operator in our schema mostly
        operators_count = active_rentals
        
        # Upcoming demand: latest pending rental request for this site
        upcoming = "None"
        req_res = await db.execute(
            select(RentalRequest).where(
                and_(RentalRequest.site_id == site.site_id, RentalRequest.status == 'pending')
            ).order_by(desc(RentalRequest.created_at)).limit(1)
        )
        req = req_res.scalar_one_or_none()
        if req:
            upcoming = f"{req.equipment_type} +1"

        # Risk Level and AI Action based on utilization
        if utilization > 90:
            risk = "High"
            ai = "Critical utilization. Source additional machines from Dealer Yard to prevent bottlenecks."
        elif utilization < 40 and machine_count > 2:
            risk = "Medium"
            ai = "Underutilized site. Consider reallocating idle assets to high-demand sites."
        else:
            risk = "Low"
            ai = "Maintain current allocation. Operations running smoothly."
            
        # User requested to remove weather data logic, so provide blank/N/A
        weather = "N/A"
        weather_temp = 0

        response_data.append(
            SiteUIResponse(
                id=site.site_id,
                name=site.site_name,
                location=site.address or site.site_name,
                machines=machine_count,
                operators=operators_count,
                utilization=utilization,
                upcomingDemand=upcoming,
                weather=weather,
                weatherTemp=weather_temp,
                riskLevel=risk,
                aiAction=ai
            )
        )
        
    return response_data

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc
from app.db.postgres import get_db
from app.models.postgres.core import Asset, Site, Rental, RentalRequest
from app.models.postgres.telemetry import Telemetry, EngineEvent
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

router = APIRouter()

class RecommendationResponse(BaseModel):
    id: str
    equipment: str
    equipmentId: str
    recommendation: str
    reason: str
    savings: int
    confidence: int
    priority: str
    category: str

@router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(db: AsyncSession = Depends(get_db)):
    recs = []
    now = datetime.utcnow()
    
    # Rule 1: High Idle Hours -> Relocation
    idle_res = await db.execute(
        select(Asset, func.sum(Telemetry.idle_hours).label('t_idle'))
        .join(Telemetry, Telemetry.asset_id == Asset.asset_id)
        .where(and_(Asset.current_status == 'available', Telemetry.timestamp >= now - timedelta(days=7)))
        .group_by(Asset.asset_id)
        .order_by(desc('t_idle'))
        .limit(2)
    )
    for i, (asset, idle_hrs) in enumerate(idle_res.all()):
        if idle_hrs and idle_hrs > 5:
            recs.append(RecommendationResponse(
                id=f"rec-idle-{asset.asset_id}",
                equipment=asset.asset_name,
                equipmentId=asset.asset_id,
                recommendation="Relocate to high-demand site",
                reason=f"Idle for {int(idle_hrs)} hours this week. Reallocate to prevent revenue loss.",
                savings=int(idle_hrs * 150),
                confidence=95 - i,
                priority="high" if idle_hrs > 20 else "medium",
                category="Relocation"
            ))

    # Rule 2: Critical Engine Events -> Maintenance
    evt_res = await db.execute(
        select(Asset, EngineEvent)
        .join(EngineEvent, EngineEvent.asset_id == Asset.asset_id)
        .where(and_(EngineEvent.severity == 'critical', EngineEvent.timestamp >= now - timedelta(days=7)))
        .order_by(desc(EngineEvent.timestamp))
        .limit(2)
    )
    for i, (asset, evt) in enumerate(evt_res.all()):
        recs.append(RecommendationResponse(
            id=f"rec-maint-{evt.event_id}",
            equipment=asset.asset_name,
            equipmentId=asset.asset_id,
            recommendation="Schedule preventive maintenance",
            reason=f"Critical alert: {evt.event_value} detected on {evt.timestamp.strftime('%b %d')}.",
            savings=5000,
            confidence=98,
            priority="high",
            category="Maintenance"
        ))

    return recs[:5]

class CopilotRequest(BaseModel):
    query: str

class CopilotResponse(BaseModel):
    reply: str

@router.post("/copilot", response_model=CopilotResponse)
async def ask_copilot(req: CopilotRequest, db: AsyncSession = Depends(get_db)):
    q = req.query
    reply = ""
    now = datetime.utcnow()

    if q == 'Which assets are wasting money?':
        idle_res = await db.execute(
            select(Asset, func.sum(Telemetry.idle_hours).label('t_idle'))
            .join(Telemetry, Telemetry.asset_id == Asset.asset_id)
            .where(and_(Asset.current_status == 'available', Telemetry.timestamp >= now - timedelta(days=7)))
            .group_by(Asset.asset_id)
            .order_by(desc('t_idle'))
            .limit(3)
        )
        assets = idle_res.all()
        if not assets:
            reply = "No assets are currently wasting significant money due to idle time."
        else:
            lines = []
            total_risk = 0
            for i, (asset, idle) in enumerate(assets):
                hrs = int(idle or 0)
                risk = hrs * 150
                total_risk += risk
                lines.append(f"{i+1}. {asset.asset_name} — {hrs} idle hrs this week, ${risk} at risk")
            reply = "Assets bleeding revenue right now:\n\n" + "\n".join(lines) + f"\n\nTotal weekly exposure: ${total_risk}. Consider relocating these units."

    elif q == 'Recommend relocations.':
        idle_res = await db.execute(
            select(Asset).where(Asset.current_status == 'available').limit(1)
        )
        asset = idle_res.scalar_one_or_none()
        req_res = await db.execute(
            select(RentalRequest).where(RentalRequest.status == 'pending').limit(1)
        )
        req = req_res.scalar_one_or_none()
        
        if asset and req:
            site_res = await db.execute(select(Site).where(Site.site_id == req.site_id))
            site = site_res.scalar_one_or_none()
            site_name = site.site_name if site else "another site"
            reply = f"Top relocation opportunity:\n\n• Move {asset.asset_name} to {site_name}\n  Reason: {site_name} has a pending request for a {req.equipment_type}\n  Savings: $2,400 | Confidence: 97%"
        else:
            reply = "No clear relocation opportunities currently based on available assets and pending requests."

    elif q == "Summarize today's fleet.":
        rentals = (await db.execute(select(func.count(Rental.rental_id)).where(Rental.rental_status == 'active'))).scalar() or 0
        total = (await db.execute(select(func.count(Asset.asset_id)))).scalar() or 1
        idle = (await db.execute(select(func.count(Asset.asset_id)).where(Asset.current_status == 'available'))).scalar() or 0
        alerts = (await db.execute(select(func.count(EngineEvent.event_id)).where(and_(EngineEvent.severity == 'critical', EngineEvent.timestamp >= now - timedelta(days=1))))).scalar() or 0
        
        util = int((rentals / total) * 100)
        reply = f"Fleet snapshot — {rentals} active rentals, {util}% utilization. {idle} units idle, {alerts} critical alerts. ${idle * 1200} revenue at risk. Action required on critical alerts."

    elif q == 'Which rentals expire tomorrow?':
        tomorrow = now + timedelta(days=1)
        next_day = tomorrow + timedelta(days=1)
        exp_res = await db.execute(
            select(Rental, Asset, Site)
            .join(Asset, Asset.asset_id == Rental.asset_id)
            .join(Site, Site.site_id == Asset.current_site_id)
            .where(and_(Rental.rental_status == 'active', Rental.expected_return >= tomorrow, Rental.expected_return < next_day))
            .limit(3)
        )
        rentals = exp_res.all()
        if not rentals:
            reply = "No rentals are scheduled to expire tomorrow."
        else:
            lines = []
            for r, a, s in rentals:
                lines.append(f"• {a.asset_name} — {s.site_name} (Expires {r.expected_return.strftime('%Y-%m-%d')})")
            reply = "Rentals expiring within 24h:\n\n" + "\n".join(lines) + "\n\nRecommend proactive renewal outreach."

    else:
        reply = "I can analyze fleet utilization, recommend relocations, flag revenue at risk, and surface expiring rentals. Try one of the suggested prompts above."
        
    return CopilotResponse(reply=reply)

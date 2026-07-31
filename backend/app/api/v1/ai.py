from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc
from app.db.postgres import get_db
from app.models.postgres.core import Asset, Site, Rental, RentalRequest
from app.models.postgres.core import Asset, Site, Rental, RentalRequest, Assignment
from app.models.postgres.telemetry import Telemetry, EngineEvent
from pydantic import BaseModel
from typing import List
@@ -38,16 +38,20 @@
.limit(2)
)
for i, (asset, idle_hrs) in enumerate(idle_res.all()):
            if idle_hrs and idle_hrs > 5:
            try:
                idle_val = float(idle_hrs or 0)
            except Exception:
                idle_val = 0.0
            if idle_val and idle_val > 5:
recs.append(RecommendationResponse(
id=f"rec-idle-{asset.asset_id}",
equipment=asset.asset_name,
equipmentId=asset.asset_id,
recommendation="Relocate to high-demand site",
                    reason=f"Idle for {int(idle_hrs)} hours this week. Reallocate to prevent revenue loss.",
                    savings=int(idle_hrs * 150),
                    confidence=95 - i,
                    priority="high" if idle_hrs > 20 else "medium",
                    reason=f"Idle for {int(idle_val)} hours this week. Reallocate to prevent revenue loss.",
                    savings=int(idle_val * 150),
                    confidence=max(50, 95 - i),
                    priority="high" if idle_val > 20 else "medium",
category="Relocation"
))
except Exception as e:
@@ -127,7 +131,12 @@
site_res = await db.execute(select(Site).where(Site.site_id == req.site_id))
site = site_res.scalar_one_or_none()
site_name = site.site_name if site else "another site"
            reply = f"Top relocation opportunity:\n\n• Move {asset.asset_name} to {site_name}\n  Reason: {site_name} has a pending request for a {req.equipment_type}\n  Savings: $2,400 | Confidence: 97%"
            reply = (
                f"Top relocation opportunity:\n\n"
                f"• Move {asset.asset_name} to {site_name}\n"
                f"  Reason: {site_name} has a pending request for a {req.equipment_type}\n"
                f"  Estimated Savings: $2,400 | Confidence: 87%\n"
            )
else:
reply = "No clear relocation opportunities currently based on available assets and pending requests."

@@ -137,31 +146,35 @@
idle = (await db.execute(select(func.count(Asset.asset_id)).where(Asset.current_status == 'available'))).scalar() or 0
alerts = (await db.execute(select(func.count(EngineEvent.event_id)).where(and_(EngineEvent.severity == 'critical', EngineEvent.timestamp >= now - timedelta(days=1))))).scalar() or 0

        util = int((rentals / total) * 100)
        reply = f"Fleet snapshot — {rentals} active rentals, {util}% utilization. {idle} units idle, {alerts} critical alerts. ${idle * 1200} revenue at risk. Action required on critical alerts."
        util = int((rentals / total) * 100) if total else 0
        reply = (
            f"Fleet snapshot — {rentals} active rentals, {util}% utilization. "
            f"{idle} units idle, {alerts} critical alerts. "
            f"${idle * 1200} revenue at risk. Action required on critical alerts. Recommend immediate inspection and maintenance for affected units."
        )

elif q == 'Which rentals expire tomorrow?':
try:
tomorrow = now + timedelta(days=1)
next_day = tomorrow + timedelta(days=1)
exp_res = await db.execute(
select(Assignment, Asset)
.join(Asset, Asset.asset_id == Assignment.asset_id)
.where(and_(Assignment.assignment_status == 'active', Assignment.end_time >= tomorrow, Assignment.end_time < next_day))
.limit(3)
)
assigns = exp_res.all()
if not assigns:
reply = "No rentals are scheduled to expire tomorrow."
else:
lines = []
for a, asset in assigns:
lines.append(f"• {asset.asset_name} — (Expires {a.end_time.strftime('%Y-%m-%d')})")
reply = "Rentals expiring within 24h:\n\n" + "\n".join(lines) + "\n\nRecommend proactive renewal outreach."
except Exception:
reply = "Unable to query rental expirations at this time."

else:
reply = "I can analyze fleet utilization, recommend relocations, flag revenue at risk, and surface expiring rentals. Try one of the suggested prompts above."

return CopilotResponse(reply=reply)
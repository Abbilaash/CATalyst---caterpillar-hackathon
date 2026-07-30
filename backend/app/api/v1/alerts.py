"""
Alerts API — REST endpoints for the CATalyst alert system.

GET  /api/v1/alerts?role=dealer              → Run engine + return dealer alerts
GET  /api/v1/alerts?role=manager&site_id=X   → Run engine + return manager alerts
GET  /api/v1/alerts?role=operator&user_id=X  → Return operator alerts
PATCH /api/v1/alerts/{id}/read               → Mark alert as read
PATCH /api/v1/alerts/{id}/dismiss            → Dismiss alert
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.services.alert_engine import run_alert_engine, get_alerts_from_db
from app.models.mongo.users import Notification

router = APIRouter()


@router.get("")
async def get_alerts(
    role: Optional[str] = Query(None, description="Filter by role: dealer, manager, operator"),
    site_id: Optional[str] = Query(None, description="Filter by site (for manager)"),
    user_id: Optional[str] = Query(None, description="Filter by user (for operator)"),
    refresh: bool = Query(True, description="Run alert engine to generate new alerts"),
    db: AsyncSession = Depends(get_db)
):
    """Get alerts. Optionally runs the alert engine first to generate new ones."""
    
    # Run alert engine to detect new conditions and save them
    if refresh:
        try:
            await run_alert_engine(db, role=role, site_id=site_id, user_id=user_id)
        except Exception as e:
            # Don't fail the whole request if engine has an error
            print(f"[AlertEngine] Error during scan: {e}")

    # Fetch all alerts from MongoDB
    alerts = await get_alerts_from_db(role=role, site_id=site_id, user_id=user_id)
    
    # Calculate summary stats
    unread = sum(1 for a in alerts if not a["isRead"])
    critical = sum(1 for a in alerts if a["severity"] == "critical")
    high = sum(1 for a in alerts if a["severity"] == "high")
    
    return {
        "alerts": alerts,
        "summary": {
            "total": len(alerts),
            "unread": unread,
            "critical": critical,
            "high": high,
        }
    }


@router.patch("/{notification_id}/read")
async def mark_alert_read(notification_id: str):
    """Mark a single alert as read."""
    from bson import ObjectId
    try:
        notif = await Notification.get(ObjectId(notification_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if not notif:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    notif.read_status = True
    await notif.save()
    return {"status": "ok"}


@router.patch("/{notification_id}/dismiss")
async def dismiss_alert(notification_id: str):
    """Dismiss an alert (hides it from future queries)."""
    from bson import ObjectId
    try:
        notif = await Notification.get(ObjectId(notification_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if not notif:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    notif.is_dismissed = True
    await notif.save()
    return {"status": "ok"}


@router.patch("/read-all")
async def mark_all_read(
    role: Optional[str] = Query(None),
):
    """Mark all alerts as read for a given role."""
    query = {"read_status": False}
    if role:
        query["target_role"] = role
    
    notifications = await Notification.find(query).to_list()
    for n in notifications:
        n.read_status = True
        await n.save()
    
    return {"status": "ok", "count": len(notifications)}

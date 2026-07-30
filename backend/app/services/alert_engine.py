"""
Alert Engine — Rule-based alert generation for CATalyst.

Scans PostgreSQL for alert conditions across 12 rules (D1-D6, M1-M5, O1-O4),
saves new alerts to MongoDB, and fires Expo push notifications for mobile roles.
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_

from app.models.postgres.core import Asset, Rental, Site, Assignment, QRScanLog, RentalRequest
from app.models.postgres.telemetry import Telemetry, EngineEvent
from app.models.mongo.users import Notification, User
from app.services.push_service import send_expo_push


async def _dedup_check(notification_type: str, asset_id: Optional[str], hours: int = 6) -> bool:
    """Check if an identical alert was already created recently (dedup window)."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    query = {
        "notification_type": notification_type,
        "created_at": {"$gte": cutoff},
    }
    if asset_id:
        query["asset_id"] = asset_id
    existing = await Notification.find_one(query)
    return existing is not None


async def _save_and_push(alert_data: dict) -> dict:
    """Save alert to MongoDB and send Expo push if target is mobile."""
    notif = Notification(**alert_data)
    await notif.insert()

    # Send push for mobile roles
    if alert_data["target_role"] in ("manager", "operator") and alert_data.get("user_id"):
        user = None
        try:
            from bson import ObjectId
            user = await User.get(ObjectId(alert_data["user_id"]))
        except Exception:
            pass
        
        if user and user.expo_push_token:
            success = await send_expo_push(
                token=user.expo_push_token,
                title=alert_data["title"],
                body=alert_data["message"],
                data={"action_url": alert_data.get("action_url", "/")},
                severity=alert_data.get("severity", "medium")
            )
            if success:
                notif.push_sent = True
                await notif.save()

    result = alert_data.copy()
    result["id"] = str(notif.id)
    return result


async def run_alert_engine(
    db: AsyncSession,
    role: Optional[str] = None,
    site_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> list[dict]:
    """Run the alert engine. Returns list of alert dicts.
    
    Args:
        db: Async SQLAlchemy session for PostgreSQL queries
        role: Filter alerts by target_role (dealer, manager, operator)
        site_id: Filter by site (for manager role)
        user_id: Filter by user (for operator role)
    """
    now = datetime.utcnow()
    alerts = []

    # ─── DEALER ALERTS (D1–D6) ───

    if role in (None, "dealer"):

        # D1: Idle Asset Revenue Drain
        # Assets with status='available' and high idle hours from telemetry
        yesterday = now - timedelta(days=1)
        idle_query = (
            select(Asset, func.sum(Telemetry.idle_hours).label("total_idle"))
            .join(Telemetry, Telemetry.asset_id == Asset.asset_id)
            .where(and_(
                Asset.current_status == "available",
                Telemetry.timestamp >= yesterday
            ))
            .group_by(Asset.asset_id)
            .having(func.sum(Telemetry.idle_hours) > 8)
        )
        idle_res = await db.execute(idle_query)
        for asset, idle_hrs in idle_res.all():
            if await _dedup_check("idle_asset", asset.asset_id):
                continue
            site_name = "Dealer Yard"
            if None:
                s = await db.execute(select(Site).where(Site.site_id == None))
                site_obj = s.scalar_one_or_none()
                if site_obj:
                    site_name = site_obj.site_name

            alert = await _save_and_push({
                "user_id": "dealer",
                "title": "Idle Asset Revenue Drain",
                "message": f"{asset.asset_name} has been idle for {int(idle_hrs)}h. "
                           f"Revenue at risk: ${int(idle_hrs * 150)}. Consider relocating.",
                "notification_type": "idle_asset",
                "severity": "high",
                "target_role": "dealer",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": f"/equipment/{asset.asset_id}",
            })
            alerts.append(alert)

        # D2: Rental Expiring in 3 days
        three_days = now + timedelta(days=3)
        exp_query = select(Rental, Asset).join(Asset, Asset.asset_id == Rental.asset_id).where(
            and_(
                Rental.rental_status == "active",
                Rental.expected_return <= three_days,
                Rental.expected_return > now
            )
        )
        exp_res = await db.execute(exp_query)
        for rental, asset in exp_res.all():
            if await _dedup_check("rental_expiring", asset.asset_id):
                continue
            days_left = max(0, (rental.expected_return - now).days)
            alert = await _save_and_push({
                "user_id": "dealer",
                "title": "Rental Expiring Soon",
                "message": f"{asset.asset_name} rental expires in {days_left} day(s). "
                           f"Contact site manager to extend or arrange pickup.",
                "notification_type": "rental_expiring",
                "severity": "medium",
                "target_role": "dealer",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": f"/equipment/{asset.asset_id}",
            })
            alerts.append(alert)

        # D3: Rental Overdue
        overdue_query = select(Rental, Asset).join(Asset, Asset.asset_id == Rental.asset_id).where(
            and_(
                Rental.rental_status == "active",
                Rental.expected_return < now
            )
        )
        overdue_res = await db.execute(overdue_query)
        for rental, asset in overdue_res.all():
            if await _dedup_check("rental_overdue", asset.asset_id):
                continue
            overdue_days = (now - rental.expected_return).days
            alert = await _save_and_push({
                "user_id": "dealer",
                "title": "Rental Overdue!",
                "message": f"{asset.asset_name} is {overdue_days} day(s) overdue. "
                           f"Immediate action required — potential revenue loss.",
                "notification_type": "rental_overdue",
                "severity": "critical",
                "target_role": "dealer",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": f"/equipment/{asset.asset_id}",
            })
            alerts.append(alert)

        # D4: Unassigned Asset at Site > 24h
        unassigned_query = select(Asset).where(
            and_(
                Asset.asset_id.isnot(None),
                Asset.current_status != "rented",
                Asset.current_status != "maintenance"
            )
        )
        unassigned_res = await db.execute(unassigned_query)
        for asset in unassigned_res.scalars().all():
            if await _dedup_check("unassigned_asset", asset.asset_id, hours=24):
                continue
            alert = await _save_and_push({
                "user_id": "dealer",
                "title": "Unassigned Asset at Site",
                "message": f"{asset.asset_name} is sitting at site unrented. "
                           f"Assign an operator or relocate to a high-demand site.",
                "notification_type": "unassigned_asset",
                "severity": "medium",
                "target_role": "dealer",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": f"/equipment/{asset.asset_id}",
            })
            alerts.append(alert)

        # D5: Critical Engine Event in last 24h
        crit_query = (
            select(EngineEvent, Asset)
            .join(Asset, Asset.asset_id == EngineEvent.asset_id)
            .where(and_(
                EngineEvent.severity == "critical",
                EngineEvent.timestamp >= yesterday
            ))
            .order_by(EngineEvent.timestamp.desc())
            .limit(10)
        )
        crit_res = await db.execute(crit_query)
        for evt, asset in crit_res.all():
            if await _dedup_check("critical_engine", asset.asset_id):
                continue
            alert = await _save_and_push({
                "user_id": "dealer",
                "title": "Critical Engine Alert",
                "message": f"{asset.asset_name}: {evt.event_type} — {evt.event_value}. "
                           f"Schedule maintenance immediately to prevent downtime.",
                "notification_type": "critical_engine",
                "severity": "critical",
                "target_role": "dealer",
                "asset_id": asset.asset_id,
                "action_url": f"/equipment/{asset.asset_id}",
            })
            alerts.append(alert)

        # D6: Demand Spike — pending requests > available matching equipment
        demand_query = (
            select(
                RentalRequest.equipment_type,
                func.count(RentalRequest.request_id).label("pending_count")
            )
            .where(RentalRequest.status == "pending")
            .group_by(RentalRequest.equipment_type)
        )
        demand_res = await db.execute(demand_query)
        for eq_type, pending_count in demand_res.all():
            avail_res = await db.execute(
                select(func.count(Asset.asset_id)).where(
                    and_(Asset.equipment_type == eq_type, Asset.current_status == "available")
                )
            )
            available = avail_res.scalar() or 0
            if pending_count > available:
                if await _dedup_check("demand_spike", eq_type, hours=12):
                    continue
                alert = await _save_and_push({
                    "user_id": "dealer",
                    "title": "Demand Spike Alert",
                    "message": f"{pending_count} pending requests for {eq_type} but only "
                               f"{available} available. Consider sourcing more units.",
                    "notification_type": "demand_spike",
                    "severity": "high",
                    "target_role": "dealer",
                    "asset_id": eq_type,  # Using eq_type as identifier for dedup
                    "action_url": "/fleet",
                })
                alerts.append(alert)

    # ─── SITE MANAGER ALERTS (M1–M5) ───

    if role in (None, "manager"):

        # M1: Unassigned Equipment on Site > 2h
        site_filter = Asset.asset_id == site_id if site_id else Asset.asset_id.isnot(None)
        m1_query = select(Asset).where(
            and_(site_filter, Asset.current_status == "available")
        )
        m1_res = await db.execute(m1_query)
        for asset in m1_res.scalars().all():
            if await _dedup_check("unassigned_on_site", asset.asset_id, hours=2):
                continue
            # Find the site manager user for push
            mgr_user_id = None
            if None:
                site_q = await db.execute(select(Site).where(Site.site_id == None))
                site_obj = site_q.scalar_one_or_none()
                if site_obj and site_obj.manager_id:
                    mgr_user_id = site_obj.manager_id

            alert = await _save_and_push({
                "user_id": mgr_user_id or "manager",
                "title": "Unassigned Equipment on Site",
                "message": f"{asset.asset_name} has no operator assigned. "
                           f"Assign an operator to start billing hours.",
                "notification_type": "unassigned_on_site",
                "severity": "high",
                "target_role": "manager",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": "/operators",
            })
            alerts.append(alert)

        # M3: Machine Idle Too Long (idle_hours > 4 on rented machine)
        m3_query = (
            select(Asset, func.sum(Telemetry.idle_hours).label("total_idle"))
            .join(Telemetry, Telemetry.asset_id == Asset.asset_id)
            .where(and_(
                Asset.current_status == "rented",
                Telemetry.timestamp >= now - timedelta(days=1)
            ))
            .group_by(Asset.asset_id)
            .having(func.sum(Telemetry.idle_hours) > 4)
        )
        if site_id:
            m3_query = m3_query.where(Asset.asset_id == site_id)
        m3_res = await db.execute(m3_query)
        for asset, idle_hrs in m3_res.all():
            if await _dedup_check("machine_idle_rented", asset.asset_id):
                continue
            alert = await _save_and_push({
                "user_id": "manager",
                "title": "Machine Idle Too Long",
                "message": f"{asset.asset_name} is rented but idle for {int(idle_hrs)}h today. "
                           f"Reassign task or investigate.",
                "notification_type": "machine_idle_rented",
                "severity": "medium",
                "target_role": "manager",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": "/assets",
            })
            alerts.append(alert)

        # M4: Maintenance Due This Week
        next_week = now + timedelta(days=7)
        m4_filter = [Asset.next_service_due <= next_week.date(), Asset.next_service_due.isnot(None)]
        if site_id:
            m4_filter.append(Asset.asset_id == site_id)
        m4_query = select(Asset).where(and_(*m4_filter))
        m4_res = await db.execute(m4_query)
        for asset in m4_res.scalars().all():
            if await _dedup_check("maintenance_due", asset.asset_id, hours=24):
                continue
            alert = await _save_and_push({
                "user_id": "manager",
                "title": "Maintenance Due This Week",
                "message": f"{asset.asset_name} service due by "
                           f"{asset.next_service_due.strftime('%b %d') if asset.next_service_due else 'soon'}. "
                           f"Schedule now to avoid unplanned downtime.",
                "notification_type": "maintenance_due",
                "severity": "medium",
                "target_role": "manager",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": "/assets",
            })
            alerts.append(alert)

        # M5: Rental Returning Tomorrow
        tomorrow = now + timedelta(days=1)
        m5_query = select(Rental, Asset).join(Asset, Asset.asset_id == Rental.asset_id).where(
            and_(
                Rental.rental_status == "active",
                Rental.expected_return >= now,
                Rental.expected_return <= tomorrow
            )
        )
        if site_id:
            m5_query = m5_query.where(Rental.asset_id == site_id)
        m5_res = await db.execute(m5_query)
        for rental, asset in m5_res.all():
            if await _dedup_check("rental_returning", asset.asset_id, hours=12):
                continue
            alert = await _save_and_push({
                "user_id": "manager",
                "title": "Rental Returning Tomorrow",
                "message": f"{asset.asset_name} rental ends tomorrow. "
                           f"Pre-plan asset handoff to avoid site downtime.",
                "notification_type": "rental_returning",
                "severity": "low",
                "target_role": "manager",
                "asset_id": asset.asset_id,
                "site_id": None,
                "action_url": "/assets",
            })
            alerts.append(alert)

    # ─── OPERATOR ALERTS (O1–O4) ───

    if role in (None, "operator"):

        # O2: Check-In Pending (assignment active, no QR check-in)
        o2_query = select(Assignment, Asset).join(
            Asset, Asset.asset_id == Assignment.asset_id
        ).where(
            and_(
                Assignment.assignment_status == "active",
                Assignment.start_time <= now,
                Assignment.end_time >= now
            )
        )
        if user_id:
            o2_query = o2_query.where(Assignment.operator_id == user_id)
        o2_res = await db.execute(o2_query)
        for assignment, asset in o2_res.all():
            # Check if there's a check-in scan for this assignment
            scan_res = await db.execute(
                select(QRScanLog).where(
                    and_(
                        QRScanLog.asset_id == asset.asset_id,
                        QRScanLog.operator_id == assignment.operator_id,
                        QRScanLog.scan_type == "check-in",
                        QRScanLog.scan_time >= assignment.start_time
                    )
                )
            )
            if scan_res.scalar_one_or_none() is None:
                if await _dedup_check("checkin_pending", asset.asset_id, hours=2):
                    continue
                alert = await _save_and_push({
                    "user_id": assignment.operator_id,
                    "title": "Check-In Pending",
                    "message": f"You have an active assignment on {asset.asset_name} "
                               f"but haven't checked in yet. Scan QR to start.",
                    "notification_type": "checkin_pending",
                    "severity": "high",
                    "target_role": "operator",
                    "asset_id": asset.asset_id,
                    "action_url": "/scan",
                })
                alerts.append(alert)

        # O3: Machine Anomaly Warning (warning-level engine events)
        o3_query = (
            select(EngineEvent, Asset, Assignment)
            .join(Asset, Asset.asset_id == EngineEvent.asset_id)
            .join(Assignment, and_(
                Assignment.asset_id == Asset.asset_id,
                Assignment.assignment_status == "active"
            ))
            .where(and_(
                EngineEvent.severity == "warning",
                EngineEvent.timestamp >= now - timedelta(hours=4)
            ))
        )
        if user_id:
            o3_query = o3_query.where(Assignment.operator_id == user_id)
        o3_res = await db.execute(o3_query)
        for evt, asset, assignment in o3_res.all():
            if await _dedup_check("machine_anomaly", asset.asset_id, hours=4):
                continue
            alert = await _save_and_push({
                "user_id": assignment.operator_id,
                "title": "Machine Anomaly Warning",
                "message": f"{asset.asset_name}: {evt.event_type} — {evt.event_value}. "
                           f"Monitor closely and report if it worsens.",
                "notification_type": "machine_anomaly",
                "severity": "high",
                "target_role": "operator",
                "asset_id": asset.asset_id,
                "action_url": "/home",
            })
            alerts.append(alert)

    return alerts


async def get_alerts_from_db(
    role: Optional[str] = None,
    site_id: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 50
) -> list[dict]:
    """Fetch existing alerts from MongoDB with filters."""
    query = {"is_dismissed": False}
    
    if role:
        query["target_role"] = role
    if site_id:
        query["site_id"] = site_id
    if user_id:
        query["user_id"] = user_id

    notifications = await Notification.find(
        query
    ).sort("-created_at").limit(limit).to_list()

    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "severity": n.severity,
            "targetRole": n.target_role,
            "assetId": n.asset_id,
            "siteId": n.site_id,
            "actionUrl": n.action_url,
            "isRead": n.read_status,
            "pushSent": n.push_sent,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]

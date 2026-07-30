from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, text
from app.db.postgres import get_db
from app.models.postgres.core import Asset, Rental, Assignment, MaintenanceLog, InterruptedAssignment
from app.models.postgres.telemetry import Telemetry, EngineEvent
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()


def build_utilization_series(assets, assignments, days=7):
    capacity_hours = sum(float(asset.get("total_runtime") or 0.0) for asset in assets) if assets else 0.0
    working_hours = 0.0
    for assignment in assignments:
        start_time = assignment.get("start_time")
        end_time = assignment.get("end_time")
        if start_time and end_time:
            duration = max((end_time - start_time).total_seconds() / 3600.0, 0.0)
            if duration > 0:
                working_hours += max(duration, 8.0)

    utilization_pct = round((working_hours / capacity_hours * 100) if capacity_hours else 0.0, 1)
    return [{
        "day": (datetime.utcnow() - timedelta(days=days - 1)).strftime("%b %d") if days > 1 else "Today",
        "working_hours": round(working_hours, 1),
        "capacity_hours": round(capacity_hours, 1),
        "utilization_pct": utilization_pct,
    }]


def build_downtime_series(maintenance_logs, interruptions, days=7):
    series = []
    relevant_dates = [
        log.get("date") for log in maintenance_logs if log.get("date")
    ] + [
        log.get("interrupted_at") for log in interruptions if log.get("interrupted_at")
    ]
    relevant_dates = [date for date in relevant_dates if isinstance(date, datetime)]
    anchor_day = min(relevant_dates).date() if relevant_dates else datetime.utcnow().date()

    for offset in range(days):
        day = anchor_day + timedelta(days=offset)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        scheduled = sum(
            1 for log in maintenance_logs
            if log.get("date") and isinstance(log.get("date"), datetime) and day_start <= log.get("date") < day_end and log.get("status") == "done"
        )
        unplanned = sum(
            1 for log in interruptions
            if log.get("interrupted_at") and isinstance(log.get("interrupted_at"), datetime) and day_start <= log.get("interrupted_at") < day_end and log.get("status") != "cancelled"
        )
        series.append({"week": day.strftime("%b %d"), "scheduled": scheduled, "unplanned": unplanned})
    return series


class KPIResponse(BaseModel):
    fleetUtilization: dict
    revenueAtRisk: dict
    idleEquipment: dict
    activeRentals: dict
    rentalExpiring: dict
    safetyAlerts: dict

@router.get("/kpis", response_model=KPIResponse)
async def get_kpis(db: AsyncSession = Depends(get_db)):
    # Calculate real numbers from DB
    
    # Active Rentals
    result = await db.execute(select(func.count(Rental.rental_id)).where(Rental.rental_status == 'active'))
    active_rentals_count = result.scalar() or 0
    
    # Idle Equipment
    result = await db.execute(select(func.count(Asset.asset_id)).where(Asset.current_status == 'available'))
    idle_count = result.scalar() or 0
    
    # Total Equipment
    result = await db.execute(select(func.count(Asset.asset_id)))
    total_equipment = result.scalar() or 1 # avoid div by zero
    
    utilization_pct = round((active_rentals_count / total_equipment) * 100, 1)

    # Rental Expiring in next 7 days
    now = datetime.utcnow()
    next_week = now + timedelta(days=7)
    exp_res = await db.execute(select(func.count(Rental.rental_id)).where(
        and_(Rental.rental_status == 'active', Rental.expected_return <= next_week)
    ))
    expiring_count = exp_res.scalar() or 0

    # Safety Alerts (critical engine events in last 24h)
    yesterday = now - timedelta(days=1)
    alert_res = await db.execute(select(func.count(EngineEvent.event_id)).where(
        and_(EngineEvent.severity == 'critical', EngineEvent.timestamp >= yesterday)
    ))
    alerts_count = alert_res.scalar() or 0

    return KPIResponse(
        fleetUtilization={"value": utilization_pct, "delta": 2.1, "trend": "up"},
        revenueAtRisk={"value": idle_count * 1200, "delta": -3.2, "trend": "down", "currency": True},
        idleEquipment={"value": idle_count, "delta": 1, "trend": "up"},
        activeRentals={"value": active_rentals_count, "delta": 4, "trend": "up"},
        rentalExpiring={"value": expiring_count, "delta": 0, "trend": "flat"},
        safetyAlerts={"value": alerts_count, "delta": -1, "trend": "down"}
    )

@router.get("/trends")
async def get_trends(db: AsyncSession = Depends(get_db)):
    asset_res = await db.execute(select(Asset.asset_id, Asset.equipment_type, Asset.total_runtime).where(Asset.total_runtime.is_not(None)))
    assets = [{"asset_id": row.asset_id, "equipment_type": row.equipment_type, "total_runtime": row.total_runtime or 0.0} for row in asset_res.all()]

    assignment_res = await db.execute(select(Assignment.asset_id, Assignment.start_time, Assignment.end_time).where(Assignment.assignment_status.in_(["active", "scheduled"])))
    assignments = [{"asset_id": row.asset_id, "start_time": row.start_time, "end_time": row.end_time} for row in assignment_res.all()]

    maintenance_res = await db.execute(select(MaintenanceLog.date, MaintenanceLog.status).where(MaintenanceLog.date.is_not(None)))
    maintenance_logs = [{"date": row.date, "status": row.status} for row in maintenance_res.all()]

    interruptions_res = await db.execute(select(InterruptedAssignment.interrupted_at, InterruptedAssignment.status).where(InterruptedAssignment.interrupted_at.is_not(None)))
    interruptions = [{"interrupted_at": row.interrupted_at, "status": row.status} for row in interruptions_res.all()]

    stmt = (
        select(
            Asset.equipment_type,
            func.sum(Telemetry.idle_hours).label('total_idle')
        )
        .join(Asset, Asset.asset_id == Telemetry.asset_id)
        .where(Telemetry.timestamp >= datetime.utcnow() - timedelta(days=7))
        .group_by(Asset.equipment_type)
    )
    result = await db.execute(stmt)
    idle_data = result.all()
    idle_analysis = [
        {"category": row.equipment_type, "hours": int(row.total_idle or 0), "cost": int((row.total_idle or 0) * 150)}
        for row in idle_data
    ]

    utilization_series = build_utilization_series(assets, assignments, days=7)
    downtime_series = build_downtime_series(maintenance_logs, interruptions, days=7)

    return {
        "demandForecast": [
            {"day": 'Mon', "Excavators": 12, "Dozers": 8, "Loaders": 10, "Graders": 4},
            {"day": 'Tue', "Excavators": 14, "Dozers": 9, "Loaders": 11, "Graders": 5},
            {"day": 'Wed', "Excavators": 15, "Dozers": 10, "Loaders": 10, "Graders": 4},
            {"day": 'Thu', "Excavators": 13, "Dozers": 8, "Loaders": 9, "Graders": 3},
            {"day": 'Fri', "Excavators": 12, "Dozers": 7, "Loaders": 8, "Graders": 3},
            {"day": 'Sat', "Excavators": 5, "Dozers": 3, "Loaders": 4, "Graders": 1},
            {"day": 'Sun', "Excavators": 4, "Dozers": 2, "Loaders": 3, "Graders": 1},
        ],
        "revenueTrend": [
            {"month": 'Jan', "revenue": 1240, "target": 1100},
            {"month": 'Feb', "revenue": 1380, "target": 1200},
            {"month": 'Mar', "revenue": 1510, "target": 1300},
            {"month": 'Apr', "revenue": 1490, "target": 1400},
            {"month": 'May', "revenue": 1680, "target": 1500},
            {"month": 'Jun', "revenue": 1820, "target": 1600},
            {"month": 'Jul', "revenue": 1960, "target": 1700},
        ],
        "utilizationTrend": [
            {"week": item["day"], "utilization": item["utilization_pct"], "idle": max(0, 100 - item["utilization_pct"])}
            for item in utilization_series
        ],
        "rentalTrends": [
            {"month": 'Jan', "new": 18, "expiring": 6, "renewed": 12},
            {"month": 'Feb', "new": 22, "expiring": 8, "renewed": 15},
            {"month": 'Mar', "new": 26, "expiring": 10, "renewed": 18},
            {"month": 'Apr', "new": 24, "expiring": 9, "renewed": 16},
            {"month": 'May', "new": 30, "expiring": 11, "renewed": 22},
            {"month": 'Jun', "new": 34, "expiring": 9, "renewed": 26},
        ],
        "downtimeData": downtime_series,
        "idleAnalysis": idle_analysis if idle_analysis else [
            {"category": 'Excavators', "hours": 0, "cost": 0},
        ]
    }

@router.get("/brief")
async def get_brief(db: AsyncSession = Depends(get_db)):
    # Calculate fleet health average from telemetry
    res = await db.execute(select(func.avg(Telemetry.battery_voltage)))
    avg_volts = res.scalar() or 12.0
    health_score = min(100, int((avg_volts / 14.0) * 100))

    # Potential savings = idle assets * daily rate
    idle_res = await db.execute(select(func.count(Asset.asset_id)).where(Asset.current_status == 'available'))
    idle = idle_res.scalar() or 0
    savings = idle * 1200

    # Critical decisions = critical alerts today
    yesterday = datetime.utcnow() - timedelta(days=1)
    crit_res = await db.execute(select(func.count(EngineEvent.event_id)).where(
        and_(EngineEvent.severity == 'critical', EngineEvent.timestamp >= yesterday)
    ))
    critical = crit_res.scalar() or 0

    return {
        "greeting": 'Good Morning, Dealer',
        "fleetHealth": health_score,
        "potentialSavings": savings,
        "criticalDecisions": critical,
        "demandTomorrow": 'Excavators',
        "demandTrend": 'up',
        "topRecommendation": {
            "text": 'Review assets with high idle hours to reduce costs.',
            "confidence": 92,
        },
    }

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime
from bson import ObjectId

from app.db.postgres import get_db
from app.models.postgres.core import Asset, Assignment, QRScanLog, Site, MaintenanceLog
from app.models.mongo.users import User, Operator
from app.schemas.operator import (
    OperatorProfileResponse, OperatorTaskResponse, AssetScanResponse,
    TaskStatusUpdateRequest, ReportIssueRequest
)

router = APIRouter()

@router.get("/{operator_id}/profile", response_model=OperatorProfileResponse)
async def get_operator_profile(operator_id: str, db: AsyncSession = Depends(get_db)):
    try:
        user = await User.get(ObjectId(operator_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid operator ID format")
        
    if not user:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    operator_doc = await Operator.find_one({"user.$id": ObjectId(operator_id)})
    if not operator_doc:
        raise HTTPException(status_code=404, detail="Operator profile not found")

    # Fetch postgres stats
    result = await db.execute(
        select(
            func.count(Assignment.assignment_id).filter(Assignment.assignment_status == 'completed'),
            func.sum(func.extract('epoch', Assignment.end_time - Assignment.start_time) / 3600).filter(Assignment.assignment_status == 'completed')
        ).where(Assignment.operator_id == operator_id)
    )
    row = result.first()
    completed_tasks = row[0] if row else 0
    hours_worked = row[1] if row and row[1] else 0

    return OperatorProfileResponse(
        name=user.name,
        employeeId=str(user.id),
        experienceYears=operator_doc.experience_years,
        assignedMachine=None,
        shiftStatus=operator_doc.shift_status,
        completedTasks=completed_tasks,
        hoursWorked=round(hours_worked, 1),
        safetyScore=operator_doc.safety_score,
        achievements=["Safety Champion", "100h Milestone"]
    )

@router.get("/{operator_id}/tasks", response_model=list[OperatorTaskResponse])
async def get_operator_tasks(operator_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Assignment, Asset).outerjoin(Asset, Assignment.asset_id == Asset.asset_id)
        .where(Assignment.operator_id == operator_id)
    )
    rows = result.all()
    
    tasks = []
    for assignment, asset in rows:
        ui_status = assignment.assignment_status
        if ui_status == 'scheduled': ui_status = 'pending'
        elif ui_status == 'active': ui_status = 'in_progress'
        
        due_time = assignment.end_time.strftime("%I:%M %p") if assignment.end_time else "TBD"
        
        tasks.append(OperatorTaskResponse(
            id=assignment.assignment_id,
            name=assignment.job_title or "Untitled Task",
            priority="High",
            machineId=asset.serial_number if asset and asset.serial_number else (asset.asset_id if asset else "Unknown"),
            machineName=asset.asset_name if asset else "Unknown",
            status=ui_status,
            dueTime=due_time
        ))
    return tasks

@router.patch("/tasks/{assignment_id}")
async def update_task_status(assignment_id: str, req: TaskStatusUpdateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assignment).where(Assignment.assignment_id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db_status = req.status
    if db_status == 'pending': db_status = 'scheduled'
    elif db_status == 'in_progress': db_status = 'active'
    
    assignment.assignment_status = db_status
    await db.flush()
    
    from app.api.v1.site_manager import update_asset_status
    await update_asset_status(assignment.asset_id, db)
    await db.commit()
    return {"message": "Status updated"}

@router.post("/{operator_id}/shift/toggle")
async def toggle_shift(operator_id: str):
    operator_doc = await Operator.find_one({"user.$id": ObjectId(operator_id)})
    if not operator_doc:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    operator_doc.shift_status = "on_duty" if operator_doc.shift_status == "off_duty" else "off_duty"
    await operator_doc.save()
    return {"shiftStatus": operator_doc.shift_status}

@router.get("/scan/{qr_code}", response_model=AssetScanResponse)
async def scan_qr(qr_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asset, Site).outerjoin(Site, Asset.current_site_id == Site.site_id).where(Asset.qr_code == qr_code))
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    asset, site = row
    
    return AssetScanResponse(
        name=asset.asset_name,
        imageSeed=asset.asset_name,
        status=asset.current_status,
        machineId=asset.serial_number or asset.asset_id,
        rentalId="RNT-" + asset.asset_id[:4] if asset.current_status == "rented" else None,
        healthScore=95,
        assignedSite=site.site_name if site else None,
        assignedOperator=None
    )

@router.post("/report-issue")
async def report_issue(req: ReportIssueRequest, db: AsyncSession = Depends(get_db)):
    log = MaintenanceLog(
        asset_id=req.asset_id,
        event="Issue Reported: " + req.problem_details,
        date=datetime.utcnow(),
        status="upcoming"
    )
    db.add(log)
    await db.commit()
    return {"message": "Issue reported"}

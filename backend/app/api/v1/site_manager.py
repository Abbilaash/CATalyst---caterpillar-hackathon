from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.postgres import get_db
from app.models.postgres.core import Site, Asset, RentalRequest, Assignment, Rental, AssignmentQueue
from app.schemas.workflows import RentalRequestCreate, RentalRequestResponse, AssignmentResponse
from app.models.mongo.users import User, SiteManager, Operator
from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel

router = APIRouter()

# --- Pydantic Schemas for Dashboard ---
class ActivityFeedItem(BaseModel):
    id: str
    type: str # 'assigned' | 'rental_started' | 'task_completed' | 'issue_reported' | 'maintenance_scheduled'
    title: str
    detail: str
    timestamp: str

class DashboardStats(BaseModel):
    totalAssets: int
    activeRentals: int
    machinesWorking: int
    machinesIdle: int
    operatorsOnDuty: int
    runningOperations: int
    maintenanceDue: int
    safetyAlerts: int

class DashboardResponse(BaseModel):
    manager_name: str
    site_name: str
    stats: DashboardStats
    activities: List[ActivityFeedItem]

# --- Pydantic Schemas for Assets ---
class AssetResponseItem(BaseModel):
    id: str
    name: str
    machineId: str
    assetType: str
    imageSeed: str
    rentalId: str
    rentalStatus: str
    status: str
    siteId: str
    siteName: str
    assignedOperatorId: Optional[str]
    assignedOperatorName: Optional[str]
    healthScore: int
    idleHours: float
    engineHours: float

# --- Pydantic Schemas for Operations ---
class OperationResponseItem(BaseModel):
    id: str
    task: str
    machineId: str
    machineName: str
    operatorId: str
    operatorName: str
    priority: str
    status: str
    progress: int
    expectedCompletion: str

# --- Pydantic Schemas for Profile ---
class ProfileResponse(BaseModel):
    id: str
    name: str
    site_name: str
    managed_assets: int
    operators: int
    reports_generated: int

# --- Pydantic Schemas for Scheduling ---
class OperatorScheduleInfo(BaseModel):
    operator_id: str
    name: str
    email: str
    license_number: str
    experience_years: int
    assigned_site_id: Optional[str]
    status: str
    certified_equipment_types: List[str]

class AssetScheduleInfo(BaseModel):
    asset_id: str
    asset_name: str
    equipment_type: str
    model: str
    current_site_id: Optional[str]
    current_status: str
    total_engine_hours: float

class AssignmentInfo(BaseModel):
    assignment_id: str
    asset_id: str
    asset_name: str
    asset_type: str
    operator_id: str
    operator_name: str
    job_title: str
    start_time: str # ISO string
    end_time: str   # ISO string
    status: str
    site_id: str

class SiteInfo(BaseModel):
    site_id: str
    site_name: str
    location: str

class SchedulingDataResponse(BaseModel):
    sites: List[SiteInfo]
    all_operators: List[OperatorScheduleInfo]
    free_operators: List[OperatorScheduleInfo]
    rented_assets: List[AssetScheduleInfo]
    free_assets: List[AssetScheduleInfo]
    existing_assignments: List[AssignmentInfo]

class SiteManagerAssignmentCreate(BaseModel):
    asset_id: str
    operator_id: str
    job_title: str
    start_date: str    # "YYYY-MM-DD"
    start_time: str    # "HH:MM"
    total_hours: float # e.g. 10.0 or 1.5

class AutoAssignTaskItem(BaseModel):
    equipment_type: str
    job_title: str
    job_description: Optional[str] = None
    start_date: str # "YYYY-MM-DD"
    start_time: str # "HH:MM"
    total_hours: float
    importance: str # "high", "medium", "low"
    priority: bool

class AutoAssignRequest(BaseModel):
    manager_id: str
    tasks: List[AutoAssignTaskItem]
    strategy: str # "any" | "fcfs"

class AutoAssignCommitItem(BaseModel):
    asset_id: str
    operator_id: str
    job_title: str
    job_description: Optional[str] = None
    start_time: str # ISO string
    end_time: str   # ISO string
    importance: str
    priority: bool

class AutoAssignCommitRequest(BaseModel):
    manager_id: str
    assignments: List[AutoAssignCommitItem]

class QueueTasksRequest(BaseModel):
    manager_id: str
    tasks: List[AutoAssignTaskItem]

class QueuedTaskResponseItem(BaseModel):
    queue_id: str
    manager_id: str
    equipment_type: str
    job_title: str
    job_description: Optional[str] = None
    start_time: str
    end_time: str
    total_hours: float
    importance: str
    priority: bool
    created_at: str

# --- Helper Site Manager Resolver ---
async def get_site_manager(manager_id: str) -> Optional[SiteManager]:
    try:
        obj_id = ObjectId(manager_id)
        sm = await SiteManager.find_one({"user.$id": obj_id})
        if sm:
            return sm
    except InvalidId:
        pass
    sm = await SiteManager.find_one({"user.$id": manager_id})
    if sm:
        return sm
    return await SiteManager.find_one()

async def get_manager_site_ids(manager_id: str) -> List[str]:
    sm = await get_site_manager(manager_id)
    if sm and sm.site_ids:
        return sm.site_ids
    return []

# --- Endpoints ---

@router.get("/dashboard/{manager_id}", response_model=DashboardResponse)
async def get_dashboard(manager_id: str, db: AsyncSession = Depends(get_db)):
    sm = await get_site_manager(manager_id)
    mgr_name = "Liam Carmichael"
    if sm:
        user = await User.get(sm.user.ref.id)
        if user:
            mgr_name = user.name
    
    site_ids = await get_manager_site_ids(manager_id)
    
    site_name = "No Assigned Site"
    if site_ids:
        site_res = await db.execute(select(Site).where(Site.site_id == site_ids[0]))
        first_site = site_res.scalar_one_or_none()
        if first_site:
            site_name = first_site.site_name

    try:
        assets_res = await db.execute(select(Asset).where(Asset.current_site_id.in_(site_ids)))
        assets = assets_res.scalars().all()
        total_assets = len(assets)
        
        working = sum(1 for a in assets if a.current_status == "working")
        idle = sum(1 for a in assets if a.current_status == "idle")
        maintenance = sum(1 for a in assets if a.current_status == "maintenance")
        
        rentals_res = await db.execute(
            select(Rental).join(Asset).where(
                Asset.current_site_id.in_(site_ids),
                Rental.rental_status == "active"
            )
        )
        active_rentals = len(rentals_res.scalars().all())

        now = datetime.utcnow()
        assigns_res = await db.execute(select(Assignment).where(
            Assignment.start_time <= now,
            Assignment.end_time >= now,
            Assignment.assignment_status == "active"
        ))
        running_ops = len(assigns_res.scalars().all())

        operators = await Operator.find({"assigned_site_id": {"$in": site_ids}}).to_list()
        operators_on_duty = sum(1 for o in operators if o.status == "on_duty" or o.status == "available")

        stats = DashboardStats(
            totalAssets=total_assets,
            activeRentals=active_rentals,
            machinesWorking=working,
            machinesIdle=idle,
            operatorsOnDuty=operators_on_duty,
            runningOperations=running_ops,
            maintenanceDue=maintenance,
            safetyAlerts=0
        )

        # Build dynamic activities from latest assignments
        recent_assigns_res = await db.execute(
            select(Assignment).where(Assignment.assignment_status == "active").order_by(Assignment.start_time.desc()).limit(5)
        )
        recent_assigns = recent_assigns_res.scalars().all()
        
        # Build operators map for activities details
        mongo_operators = await Operator.find().to_list()
        op_map = {}
        for o in mongo_operators:
            user = await User.get(o.user.ref.id)
            if user:
                op_map[str(user.id)] = user.name

        activities = []
        for ass in recent_assigns:
            asset_res = await db.execute(select(Asset).where(Asset.asset_id == ass.asset_id))
            asset = asset_res.scalar_one_or_none()
            asset_name = asset.asset_name if asset else "Machinery"
            op_name = op_map.get(ass.operator_id, "Operator")
            
            activities.append(ActivityFeedItem(
                id=ass.assignment_id,
                type="assigned",
                title="Equipment Assigned",
                detail=f"{asset_name} → {op_name}",
                timestamp=ass.start_time.strftime("%I:%M %p") if ass.start_time else "Just now"
            ))

    except Exception as e:
        import traceback
        traceback.print_exc()
        stats = DashboardStats(
            totalAssets=0, activeRentals=0, machinesWorking=0, machinesIdle=0,
            operatorsOnDuty=0, runningOperations=0, maintenanceDue=0, safetyAlerts=0
        )
        activities = []

    return DashboardResponse(
        manager_name=mgr_name,
        site_name=site_name,
        stats=stats,
        activities=activities
    )

@router.get("/assets/{manager_id}", response_model=List[AssetResponseItem])
async def get_assets(manager_id: str, db: AsyncSession = Depends(get_db)):
    site_ids = await get_manager_site_ids(manager_id)
    
    try:
        assets_res = await db.execute(select(Asset).where(Asset.current_site_id.in_(site_ids)))
        db_assets = assets_res.scalars().all()
        
        if not db_assets:
            return []

        sites_res = await db.execute(select(Site).where(Site.site_id.in_(site_ids)))
        sites_map = {s.site_id: s.site_name for s in sites_res.scalars().all()}

        operators = await Operator.find().to_list()
        op_map = {}
        for o in operators:
            user = await User.get(o.user.ref.id)
            if user:
                op_map[str(user.id)] = user.name

        response = []
        for a in db_assets:
            op_id = None
            op_name = None
            
            assign_res = await db.execute(
                select(Assignment).where(
                    Assignment.asset_id == a.asset_id,
                    Assignment.assignment_status == "active"
                )
            )
            active_assign = assign_res.scalars().first()
            if active_assign:
                op_id = active_assign.operator_id
                op_name = op_map.get(op_id, "Operator")

            response.append(AssetResponseItem(
                id=a.asset_id,
                name=a.asset_name,
                machineId=a.serial_number or a.asset_id[:8].upper(),
                assetType=a.equipment_type or "Machinery",
                imageSeed="excavator" if "excavator" in (a.equipment_type or "").lower() else "loader",
                rentalId="RNT-1002",
                rentalStatus="active" if a.current_status == "rented" or a.current_status == "working" else "completed",
                status=a.current_status if a.current_status in ["working", "idle", "maintenance", "available"] else "available",
                siteId=a.current_site_id or "",
                siteName=sites_map.get(a.current_site_id, "Quarry Site"),
                assignedOperatorId=op_id,
                assignedOperatorName=op_name,
                healthScore=90,
                idleHours=4.5,
                engineHours=a.total_engine_hours or 120.0
            ))
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []

@router.get("/operations/{manager_id}", response_model=List[OperationResponseItem])
async def get_operations(manager_id: str, db: AsyncSession = Depends(get_db)):
    site_ids = await get_manager_site_ids(manager_id)
    
    try:
        # Retrieve all active/scheduled/paused/completed assignments
        result = await db.execute(
            select(Assignment).where(Assignment.assignment_status.in_(["active", "scheduled", "paused", "completed"]))
        )
        assignments = result.scalars().all()
        
        if not assignments:
            return []

        operators = await Operator.find().to_list()
        op_map = {}
        for o in operators:
            user = await User.get(o.user.ref.id)
            if user:
                op_map[str(user.id)] = user.name

        response = []
        now = datetime.utcnow()
        for ass in assignments:
            asset_res = await db.execute(select(Asset).where(Asset.asset_id == ass.asset_id))
            asset = asset_res.scalar_one_or_none()
            if not asset or asset.current_site_id not in site_ids:
                continue

            # Calculate progress percentage dynamically
            progress = 0
            if ass.start_time and ass.end_time:
                if now < ass.start_time:
                    progress = 0
                elif now > ass.end_time:
                    progress = 100
                else:
                    total_dur = (ass.end_time - ass.start_time).total_seconds()
                    if total_dur > 0:
                        progress = int(((now - ass.start_time).total_seconds() / total_dur) * 100)
            
            progress = max(0, min(100, progress))

            # Infer priority from job title
            title_lower = (ass.job_title or "").lower()
            if "high" in title_lower or "trench" in title_lower or "excavation" in title_lower:
                priority = "high"
            elif "low" in title_lower or "stockpile" in title_lower:
                priority = "low"
            else:
                priority = "medium"

            response.append(OperationResponseItem(
                id=ass.assignment_id,
                task=ass.job_title or "Trench excavation",
                machineId=asset.serial_number or asset.asset_id[:8].upper(),
                machineName=asset.asset_name,
                operatorId=ass.operator_id,
                operatorName=op_map.get(ass.operator_id, "Operator"),
                priority=priority,
                status="completed" if ass.assignment_status == "completed" else ("in_progress" if ass.assignment_status == "active" else "paused"),
                progress=progress,
                expectedCompletion=ass.end_time.strftime("%H:%M")
            ))
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []

@router.post("/operations/{assignment_id}/complete")
async def complete_operation(assignment_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Assignment).where(Assignment.assignment_id == assignment_id))
        assignment = result.scalar_one_or_none()
        if not assignment:
            raise HTTPException(status_code=404, detail="Operation not found")

        assignment.assignment_status = "completed"
        
        # Free the associated asset
        asset_res = await db.execute(select(Asset).where(Asset.asset_id == assignment.asset_id))
        asset = asset_res.scalar_one_or_none()
        if asset:
            asset.current_status = "available"

        # Mark operator available in MongoDB
        try:
            from bson import ObjectId as BsonObjId
            op_oid = BsonObjId(assignment.operator_id)
            await Operator.find_one({"user.$id": op_oid}).update({"$set": {"status": "available"}})
        except Exception:
            pass

        await db.commit()
        
        # Trigger background queue check since resources are released!
        await process_assignments_queue(assignment.manager_id, db)
        
        return {"status": "success", "message": "Operation marked complete and equipment released"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/operations/{assignment_id}/reassign")
async def reassign_operation(assignment_id: str, operator_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Assignment).where(Assignment.assignment_id == assignment_id))
        assignment = result.scalar_one_or_none()
        if not assignment:
            raise HTTPException(status_code=404, detail="Operation not found")

        assignment.operator_id = operator_id
        await db.commit()
        return {"status": "success", "message": f"Operation successfully reassigned to operator {operator_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/operations/{assignment_id}")
async def delete_operation(assignment_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Assignment).where(Assignment.assignment_id == assignment_id))
        assignment = result.scalar_one_or_none()
        if not assignment:
            raise HTTPException(status_code=404, detail="Operation not found")
        
        # Free the associated asset
        asset_res = await db.execute(select(Asset).where(Asset.asset_id == assignment.asset_id))
        asset = asset_res.scalar_one_or_none()
        if asset:
            asset.current_status = "available"
            
        try:
            from bson import ObjectId as BsonObjId
            op_oid = BsonObjId(assignment.operator_id)
            await Operator.find_one({"user.$id": op_oid}).update({"$set": {"status": "available"}})
        except Exception:
            pass
            
        await db.delete(assignment)
        await db.commit()
        return {"status": "success", "message": "Operation successfully deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{manager_id}", response_model=ProfileResponse)
async def get_profile(manager_id: str, db: AsyncSession = Depends(get_db)):
    sm = await get_site_manager(manager_id)
    
    name = "Liam Carmichael"
    if sm:
        user = await User.get(sm.user.ref.id)
        if user:
            name = user.name
    site_ids = await get_manager_site_ids(manager_id)
    
    site_name = "No Site"
    if site_ids:
        site_res = await db.execute(select(Site).where(Site.site_id == site_ids[0]))
        first_site = site_res.scalar_one_or_none()
        if first_site:
            site_name = first_site.site_name

    assets_count = 0
    try:
        assets_res = await db.execute(select(Asset).where(Asset.current_site_id.in_(site_ids)))
        assets_count = len(assets_res.scalars().all())
    except Exception:
        pass

    operators_count = 0
    try:
        operators = await Operator.find({"assigned_site_id": {"$in": site_ids}}).to_list()
        operators_count = len(operators)
    except Exception:
        pass

    return ProfileResponse(
        id=manager_id,
        name=name,
        site_name=site_name,
        managed_assets=assets_count,
        operators=operators_count,
        reports_generated=24
    )

@router.get("/sites/{manager_id}")
async def get_my_sites(manager_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site).where(Site.manager_id == manager_id))
    sites = result.scalars().all()
    return sites

@router.post("/requests/{manager_id}", response_model=RentalRequestResponse)
async def request_machinery(manager_id: str, req: RentalRequestCreate, db: AsyncSession = Depends(get_db)):
    new_req = RentalRequest(
        site_id="site-01",
        manager_id=manager_id,
        equipment_type=req.equipment_type,
        quantity=req.quantity,
        requested_start_date=req.requested_start_date,
        requested_end_date=req.requested_end_date
    )
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return new_req

@router.post("/assign", response_model=AssignmentResponse)
async def assign_operator(assignment: SiteManagerAssignmentCreate, db: AsyncSession = Depends(get_db)):
    sm = await SiteManager.find_one()
    resolved_mgr_id = "mgr-01"
    if sm:
        user = await User.get(sm.user.ref.id)
        if user:
            resolved_mgr_id = str(user.id)

    try:
        start_dt = datetime.strptime(f"{assignment.start_date} {assignment.start_time}", "%Y-%m-%d %H:%M")
        end_dt = start_dt + timedelta(hours=assignment.total_hours)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date or time format. start_date must be YYYY-MM-DD and start_time must be HH:MM."
        )

    # Check for overlapping assignments for the same operator
    overlap_op_stmt = select(Assignment).where(
        Assignment.operator_id == assignment.operator_id,
        Assignment.assignment_status.in_(["active", "scheduled"]),
        Assignment.start_time < end_dt,
        Assignment.end_time > start_dt
    )
    overlap_op_res = await db.execute(overlap_op_stmt)
    overlap_op = overlap_op_res.scalar_one_or_none()
    if overlap_op:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operator is already assigned to task '{overlap_op.job_title}' during this time window."
        )

    # Check for overlapping assignments for the same asset
    overlap_asset_stmt = select(Assignment).where(
        Assignment.asset_id == assignment.asset_id,
        Assignment.assignment_status.in_(["active", "scheduled"]),
        Assignment.start_time < end_dt,
        Assignment.end_time > start_dt
    )
    overlap_asset_res = await db.execute(overlap_asset_stmt)
    overlap_asset = overlap_asset_res.scalar_one_or_none()
    if overlap_asset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Equipment is already scheduled for task '{overlap_asset.job_title}' during this time window."
        )

    new_assignment = Assignment(
        asset_id=assignment.asset_id,
        operator_id=assignment.operator_id,
        manager_id=resolved_mgr_id,
        job_title=assignment.job_title,
        start_time=start_dt,
        end_time=end_dt,
        assignment_status="active"
    )
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    
    # Update asset status
    asset_res = await db.execute(select(Asset).where(Asset.asset_id == assignment.asset_id))
    asset = asset_res.scalar_one_or_none()
    if asset:
        asset.current_status = "working"
        await db.commit()

    # Update operator status in MongoDB
    try:
        from bson import ObjectId as BsonObjId
        op_oid = BsonObjId(assignment.operator_id)
        await Operator.find_one({"user.$id": op_oid}).update({"$set": {"status": "on_duty"}})
    except Exception:
        pass

    return new_assignment

@router.get("/scheduling-data/{manager_id}", response_model=SchedulingDataResponse)
async def get_scheduling_data(manager_id: str, db: AsyncSession = Depends(get_db)):
    site_ids = await get_manager_site_ids(manager_id)

    # --- Sites ---
    sites_result = await db.execute(select(Site).where(Site.site_id.in_(site_ids)))
    db_sites = sites_result.scalars().all()
    sites_list = [
        SiteInfo(
            site_id=s.site_id,
            site_name=s.site_name,
            location=s.address or ""
        ) for s in db_sites
    ]

    # --- Operators from MongoDB ---
    mongo_operators = await Operator.find(
        {"assigned_site_id": {"$in": site_ids}}
    ).to_list()
    
    # --- Assets from PostgreSQL ---
    asset_result = await db.execute(
        select(Asset).where(Asset.current_site_id.in_(site_ids))
    )
    db_assets = asset_result.scalars().all()
    asset_map = {a.asset_id: a for a in db_assets}
    
    # Fetch all assignments of active/scheduled states to find busy resources
    assignment_result = await db.execute(
        select(Assignment).where(Assignment.assignment_status.in_(["active", "scheduled"]))
    )
    all_active_assignments = assignment_result.scalars().all()
    
    busy_operator_ids = {assign.operator_id for assign in all_active_assignments}
    busy_asset_ids = {assign.asset_id for assign in all_active_assignments}
    
    # Build operator_id → name lookup
    all_operators_list = []
    free_operators_list = []
    op_name_map = {}
    
    for op in mongo_operators:
        user = await User.get(op.user.ref.id)
        user_name = user.name if user else "Operator"
        user_email = user.email if user else ""
        user_id_str = str(user.id) if user else str(op.id)
        op_name_map[user_id_str] = user_name
        
        op_info = OperatorScheduleInfo(
            operator_id=user_id_str,
            name=user_name,
            email=user_email,
            license_number=op.license_number,
            experience_years=op.experience_years,
            assigned_site_id=op.assigned_site_id,
            status=op.status,
            certified_equipment_types=getattr(op, "certified_equipment_types", [])
        )
        all_operators_list.append(op_info)
        if user_id_str not in busy_operator_ids:
            free_operators_list.append(op_info)

    # --- Build assignment info list with ISO strings ---
    existing_assignments_list = []
    for assign in all_active_assignments:
        asset = asset_map.get(assign.asset_id)
        if not asset or asset.current_site_id not in site_ids:
            continue
        existing_assignments_list.append(AssignmentInfo(
            assignment_id=assign.assignment_id,
            asset_id=assign.asset_id,
            asset_name=asset.asset_name if asset else "Unknown",
            asset_type=asset.equipment_type if asset else "Unknown",
            operator_id=assign.operator_id,
            operator_name=op_name_map.get(assign.operator_id, "Operator"),
            job_title=assign.job_title or "Task",
            start_time=assign.start_time.isoformat() if assign.start_time else datetime.utcnow().isoformat(),
            end_time=assign.end_time.isoformat() if assign.end_time else (datetime.utcnow() + timedelta(hours=8)).isoformat(),
            status=assign.assignment_status,
            site_id=asset.current_site_id if asset else ""
        ))

    # --- Assets ---
    rented_assets_list = []
    free_assets_list = []
    
    for asset in db_assets:
        asset_info = AssetScheduleInfo(
            asset_id=asset.asset_id,
            asset_name=asset.asset_name,
            equipment_type=asset.equipment_type or "",
            model=asset.model or "",
            current_site_id=asset.current_site_id,
            current_status=asset.current_status or "",
            total_engine_hours=asset.total_engine_hours or 0.0
        )
        rented_assets_list.append(asset_info)
        if asset.asset_id not in busy_asset_ids:
            free_assets_list.append(asset_info)
            
    return SchedulingDataResponse(
        sites=sites_list,
        all_operators=all_operators_list,
        free_operators=free_operators_list,
        rented_assets=rented_assets_list,
        free_assets=free_assets_list,
        existing_assignments=existing_assignments_list
    )

def is_operator_certified_python(op_certs: List[str], asset_type: str) -> bool:
    certs = [c.lower() for c in op_certs]
    type_str = asset_type.lower()
    if 'excavator' in type_str: return 'excavator' in certs
    if 'dozer' in type_str: return 'dozer' in certs
    if 'loader' in type_str: return 'loader' in certs
    if 'grader' in type_str: return 'grader' in certs
    if 'scraper' in type_str: return 'scraper' in certs
    if 'truck' in type_str: return 'truck' in certs or 'scraper' in certs
    if 'compactor' in type_str: return 'compactor' in certs
    return any(c in type_str for c in certs)

@router.post("/auto-assign/preview")
async def auto_assign_preview(req: AutoAssignRequest, db: AsyncSession = Depends(get_db)):
    site_ids = await get_manager_site_ids(req.manager_id)
    
    # 1. Fetch assets
    asset_res = await db.execute(select(Asset).where(Asset.current_site_id.in_(site_ids)))
    db_assets = asset_res.scalars().all()
    
    # 2. Fetch operators
    mongo_operators = await Operator.find({"assigned_site_id": {"$in": site_ids}}).to_list()
    op_map = {}
    for o in mongo_operators:
        user = await User.get(o.user.ref.id)
        if user:
            op_map[str(user.id)] = {
                "name": user.name,
                "experience_years": o.experience_years,
                "certified_equipment_types": getattr(o, "certified_equipment_types", [])
            }
            
    # 3. Fetch existing assignments
    existing_res = await db.execute(
        select(Assignment).where(Assignment.assignment_status.in_(["active", "scheduled"]))
    )
    existing_assigns = existing_res.scalars().all()
    
    # 4. Initialize busy slots track
    busy_assets = {}
    busy_operators = {}
    
    for ass in existing_assigns:
        if ass.asset_id not in busy_assets:
            busy_assets[ass.asset_id] = []
        busy_assets[ass.asset_id].append((ass.start_time, ass.end_time))
        
        if ass.operator_id not in busy_operators:
            busy_operators[ass.operator_id] = []
        busy_operators[ass.operator_id].append((ass.start_time, ass.end_time))
        
    # 5. Parse tasks
    tasks_to_schedule = []
    for idx, t in enumerate(req.tasks):
        try:
            start_dt = datetime.strptime(f"{t.start_date} {t.start_time}", "%Y-%m-%d %H:%M")
            end_dt = start_dt + timedelta(hours=t.total_hours)
            tasks_to_schedule.append({
                "index": idx,
                "equipment_type": t.equipment_type,
                "job_title": t.job_title,
                "job_description": t.job_description,
                "start_time": start_dt,
                "end_time": end_dt,
                "total_hours": t.total_hours,
                "importance": t.importance,
                "priority": t.priority
            })
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date/time in batch tasks.")
            
    # 6. Apply strategy sorting
    if req.strategy == "fcfs":
        pass
    else:
        # Sort by priority desc (True first), then importance (high -> medium -> low)
        importance_rank = {"high": 3, "medium": 2, "low": 1}
        tasks_to_schedule.sort(
            key=lambda k: (1 if k["priority"] else 0, importance_rank.get(k["importance"], 0)),
            reverse=True
        )
        
    proposed_assignments = []
    unassigned_tasks = []
    
    for task in tasks_to_schedule:
        task_start = task["start_time"]
        task_end = task["end_time"]
        task_day = task_start.date()
        
        # 6a. Find candidate assets
        candidates_assets = []
        for a in db_assets:
            if a.equipment_type.lower() != task["equipment_type"].lower():
                continue
            
            # Check overlap
            has_overlap = False
            for b_start, b_end in busy_assets.get(a.asset_id, []):
                if task_start < b_end and task_end > b_start:
                    has_overlap = True
                    break
            if has_overlap:
                continue
                
            # Check 24h runtime limit
            scheduled_durations = 0.0
            for ass in existing_assigns:
                if ass.asset_id == a.asset_id and ass.start_time.date() == task_day:
                    scheduled_durations += (ass.end_time - ass.start_time).total_seconds() / 3600.0
            for prop in proposed_assignments:
                if prop["asset_id"] == a.asset_id and prop["start_time"].date() == task_day:
                    scheduled_durations += prop["total_hours"]
                    
            limit = getattr(a, "total_runtime", 16.0) or 16.0
            if scheduled_durations + task["total_hours"] > limit:
                continue
                
            candidates_assets.append(a)
            
        # 6b. Find candidate operators
        candidates_operators = []
        for op_id, op_info in op_map.items():
            if not is_operator_certified_python(op_info["certified_equipment_types"], task["equipment_type"]):
                continue
                
            has_overlap = False
            for b_start, b_end in busy_operators.get(op_id, []):
                if task_start < b_end and task_end > b_start:
                    has_overlap = True
                    break
            if has_overlap:
                continue
                
            candidates_operators.append((op_id, op_info))
            
        # 6c. Match asset & operator
        if not candidates_assets or not candidates_operators:
            unassigned_tasks.append({
                "job_title": task["job_title"],
                "equipment_type": task["equipment_type"],
                "start_time": task_start.isoformat(),
                "end_time": task_end.isoformat(),
                "reason": "No available equipment or certified operators during this slot."
            })
            continue
            
        # Sort operators by experience: higher experience first if high importance/priority
        if task["importance"] == "high" or task["priority"]:
            candidates_operators.sort(key=lambda o: o[1]["experience_years"], reverse=True)
        else:
            candidates_operators.sort(key=lambda o: o[1]["experience_years"])
            
        selected_asset = candidates_assets[0]
        selected_op_id, selected_op_info = candidates_operators[0]
        
        proposed_assignments.append({
            "asset_id": selected_asset.asset_id,
            "asset_name": selected_asset.asset_name,
            "operator_id": selected_op_id,
            "operator_name": selected_op_info["name"],
            "job_title": task["job_title"],
            "job_description": task["job_description"] or "",
            "start_time": task_start,
            "end_time": task_end,
            "total_hours": task["total_hours"],
            "importance": task["importance"],
            "priority": task["priority"]
        })
        
        if selected_asset.asset_id not in busy_assets:
            busy_assets[selected_asset.asset_id] = []
        busy_assets[selected_asset.asset_id].append((task_start, task_end))
        
        if selected_op_id not in busy_operators:
            busy_operators[selected_op_id] = []
        busy_operators[selected_op_id].append((task_start, task_end))
        
    serialized_proposed = []
    for prop in proposed_assignments:
        serialized_proposed.append({
            "asset_id": prop["asset_id"],
            "asset_name": prop["asset_name"],
            "operator_id": prop["operator_id"],
            "operator_name": prop["operator_name"],
            "job_title": prop["job_title"],
            "job_description": prop["job_description"],
            "start_time": prop["start_time"].isoformat(),
            "end_time": prop["end_time"].isoformat(),
            "importance": prop["importance"],
            "priority": prop["priority"]
        })
        
    return {
        "assignments": serialized_proposed,
        "unassigned_tasks": unassigned_tasks
    }

@router.post("/auto-assign/commit")
async def auto_assign_commit(req: AutoAssignCommitRequest, db: AsyncSession = Depends(get_db)):
    try:
        new_assignments = []
        for prop in req.assignments:
            start_dt = datetime.fromisoformat(prop.start_time)
            end_dt = datetime.fromisoformat(prop.end_time)
            
            new_asg = Assignment(
                asset_id=prop.asset_id,
                operator_id=prop.operator_id,
                manager_id=req.manager_id,
                job_title=prop.job_title,
                job_description=prop.job_description or "",
                start_time=start_dt,
                end_time=end_dt,
                importance=prop.importance,
                priority=prop.priority,
                assignment_status="active"
            )
            db.add(new_asg)
            new_assignments.append(new_asg)
            
            # Update asset status
            asset_res = await db.execute(select(Asset).where(Asset.asset_id == prop.asset_id))
            asset = asset_res.scalar_one_or_none()
            if asset:
                asset.current_status = "working"
                
            # Update operator status
            try:
                from bson import ObjectId as BsonObjId
                op_oid = BsonObjId(prop.operator_id)
                await Operator.find_one({"user.$id": op_oid}).update({"$set": {"status": "on_duty"}})
            except Exception:
                pass
                
        await db.commit()
        return {"status": "success", "message": f"Successfully committed {len(new_assignments)} assignments."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-assign/queue")
async def add_to_queue(req: QueueTasksRequest, db: AsyncSession = Depends(get_db)):
    try:
        queued_items = []
        for t in req.tasks:
            start_dt = datetime.strptime(f"{t.start_date} {t.start_time}", "%Y-%m-%d %H:%M")
            end_dt = start_dt + timedelta(hours=t.total_hours)
            
            q_task = AssignmentQueue(
                manager_id=req.manager_id,
                equipment_type=t.equipment_type,
                job_title=t.job_title,
                job_description=t.job_description or "",
                start_time=start_dt,
                end_time=end_dt,
                total_hours=t.total_hours,
                importance=t.importance,
                priority=t.priority
            )
            db.add(q_task)
            queued_items.append(q_task)
            
        await db.commit()
        return {"status": "success", "message": f"Successfully queued {len(queued_items)} tasks."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auto-assign/queue/{manager_id}", response_model=List[QueuedTaskResponseItem])
async def get_queue(manager_id: str, db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(
            select(AssignmentQueue)
            .where(AssignmentQueue.manager_id == manager_id)
            .order_by(AssignmentQueue.created_at.desc())
        )
        queue_items = res.scalars().all()
        return [
            QueuedTaskResponseItem(
                queue_id=q.queue_id,
                manager_id=q.manager_id,
                equipment_type=q.equipment_type,
                job_title=q.job_title,
                job_description=q.job_description,
                start_time=q.start_time.isoformat(),
                end_time=q.end_time.isoformat(),
                total_hours=q.total_hours,
                importance=q.importance,
                priority=q.priority,
                created_at=q.created_at.isoformat() if q.created_at else datetime.utcnow().isoformat()
            )
            for q in queue_items
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/auto-assign/queue/{queue_id}")
async def cancel_queue_item(queue_id: str, db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(AssignmentQueue).where(AssignmentQueue.queue_id == queue_id))
        q_item = res.scalar_one_or_none()
        if not q_item:
            raise HTTPException(status_code=404, detail="Queue item not found.")
            
        await db.delete(q_item)
        await db.commit()
        return {"status": "success", "message": "Queue item successfully cancelled."}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def process_assignments_queue(manager_id: str, db: AsyncSession):
    try:
        # 1. Fetch queue items for this manager
        queue_res = await db.execute(
            select(AssignmentQueue)
            .where(AssignmentQueue.manager_id == manager_id)
            .order_by(AssignmentQueue.priority.desc(), AssignmentQueue.created_at.asc())
        )
        queued_tasks = queue_res.scalars().all()
        if not queued_tasks:
            return
            
        importance_rank = {"high": 3, "medium": 2, "low": 1}
        queued_tasks_sorted = sorted(
            queued_tasks,
            key=lambda q: (1 if q.priority else 0, importance_rank.get(q.importance or "medium", 2), -q.created_at.timestamp()),
            reverse=True
        )
        
        # 2. Get manager's site IDs
        site_ids = await get_manager_site_ids(manager_id)
        if not site_ids:
            return
            
        # 3. Fetch assets
        asset_res = await db.execute(select(Asset).where(Asset.current_site_id.in_(site_ids)))
        db_assets = asset_res.scalars().all()
        
        # 4. Fetch operators
        mongo_operators = await Operator.find({"assigned_site_id": {"$in": site_ids}}).to_list()
        op_map = {}
        for o in mongo_operators:
            user = await User.get(o.user.ref.id)
            if user:
                op_map[str(user.id)] = {
                    "name": user.name,
                    "experience_years": o.experience_years,
                    "certified_equipment_types": getattr(o, "certified_equipment_types", [])
                }
                
        # 5. Fetch existing active/scheduled assignments
        existing_res = await db.execute(
            select(Assignment).where(Assignment.assignment_status.in_(["active", "scheduled"]))
        )
        existing_assigns = existing_res.scalars().all()
        
        # 6. Initialize busy timelines
        busy_assets = {}
        busy_operators = {}
        for ass in existing_assigns:
            if ass.asset_id not in busy_assets:
                busy_assets[ass.asset_id] = []
            busy_assets[ass.asset_id].append((ass.start_time, ass.end_time))
            
            if ass.operator_id not in busy_operators:
                busy_operators[ass.operator_id] = []
            busy_operators[ass.operator_id].append((ass.start_time, ass.end_time))
            
        new_assignments = []
        queued_to_delete = []
        
        for task in queued_tasks_sorted:
            task_start = task.start_time
            task_end = task.end_time
            task_day = task_start.date()
            
            # 6a. Find candidate assets
            candidates_assets = []
            for a in db_assets:
                if a.equipment_type.lower() != task.equipment_type.lower():
                    continue
                
                # Check overlap
                has_overlap = False
                for b_start, b_end in busy_assets.get(a.asset_id, []):
                    if task_start < b_end and task_end > b_start:
                        has_overlap = True
                        break
                if has_overlap:
                    continue
                    
                # Check 24h runtime limit
                scheduled_durations = 0.0
                for ass in existing_assigns:
                    if ass.asset_id == a.asset_id and ass.start_time.date() == task_day:
                        scheduled_durations += (ass.end_time - ass.start_time).total_seconds() / 3600.0
                for prop in new_assignments:
                    if prop.asset_id == a.asset_id and prop.start_time.date() == task_day:
                        scheduled_durations += (prop.end_time - prop.start_time).total_seconds() / 3600.0
                        
                limit = getattr(a, "total_runtime", 16.0) or 16.0
                if scheduled_durations + task.total_hours > limit:
                    continue
                    
                candidates_assets.append(a)
                
            # 6b. Find candidate operators
            candidates_operators = []
            for op_id, op_info in op_map.items():
                if not is_operator_certified_python(op_info["certified_equipment_types"], task.equipment_type):
                    continue
                    
                has_overlap = False
                for b_start, b_end in busy_operators.get(op_id, []):
                    if task_start < b_end and task_end > b_start:
                        has_overlap = True
                        break
                if has_overlap:
                    continue
                    
                candidates_operators.append((op_id, op_info))
                
            # 6c. Match asset & operator
            if not candidates_assets or not candidates_operators:
                continue
                
            if task.importance == "high" or task.priority:
                candidates_operators.sort(key=lambda o: o[1]["experience_years"], reverse=True)
            else:
                candidates_operators.sort(key=lambda o: o[1]["experience_years"])
                
            selected_asset = candidates_assets[0]
            selected_op_id, selected_op_info = candidates_operators[0]
            
            new_asg = Assignment(
                asset_id=selected_asset.asset_id,
                operator_id=selected_op_id,
                manager_id=manager_id,
                job_title=task.job_title,
                job_description=task.job_description or "",
                start_time=task_start,
                end_time=task_end,
                importance=task.importance,
                priority=task.priority,
                assignment_status="active"
            )
            db.add(new_asg)
            new_assignments.append(new_asg)
            queued_to_delete.append(task)
            
            # Update busy timelines
            if selected_asset.asset_id not in busy_assets:
                busy_assets[selected_asset.asset_id] = []
            busy_assets[selected_asset.asset_id].append((task_start, task_end))
            
            if selected_op_id not in busy_operators:
                busy_operators[selected_op_id] = []
            busy_operators[selected_op_id].append((task_start, task_end))
            
            # Update asset status
            selected_asset.current_status = "working"
            
            # Update operator status
            try:
                from bson import ObjectId as BsonObjId
                op_oid = BsonObjId(selected_op_id)
                await Operator.find_one({"user.$id": op_oid}).update({"$set": {"status": "on_duty"}})
            except Exception:
                pass

        # Delete resolved items from queue
        for task in queued_to_delete:
            await db.delete(task)
            
        if new_assignments:
            await db.commit()
    except Exception as e:
        print(f"Error in queue processing daemon: {e}")

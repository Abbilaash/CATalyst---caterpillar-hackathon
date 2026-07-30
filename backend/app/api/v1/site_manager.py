from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List

from app.db.postgres import get_db
from app.models.postgres.core import Site, Asset, RentalRequest, Assignment
from app.schemas.workflows import RentalRequestCreate, RentalRequestResponse, AssignmentCreate, AssignmentResponse
from app.models.mongo.users import User, SiteManager
from pydantic import BaseModel

router = APIRouter()

# Dependency to mock current user role verification (in a real app, you'd use JWT)
async def verify_site_manager(user_id: str):
    sm = await SiteManager.find_one(SiteManager.user.id == user_id)
    if not sm:
        raise HTTPException(status_code=403, detail="Not a Site Manager")
    return sm

@router.get("/sites/{manager_id}")
async def get_my_sites(manager_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site).where(Site.manager_id == manager_id))
    sites = result.scalars().all()
    return sites

@router.post("/requests/{manager_id}", response_model=RentalRequestResponse)
async def request_machinery(manager_id: str, req: RentalRequestCreate, db: AsyncSession = Depends(get_db)):
    # Create the request
    new_req = RentalRequest(
        site_id="site-001", # Hardcoded for mock test
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
async def assign_operator(assignment: AssignmentCreate, db: AsyncSession = Depends(get_db)):
    # Create time-bound assignment for operator
    new_assignment = Assignment(
        asset_id=assignment.asset_id,
        operator_id=assignment.operator_id,
        manager_id="manager-mock-id", # In real app, derived from auth token
        job_title=assignment.job_title,
        start_time=assignment.start_time,
        end_time=assignment.end_time
    )
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    
    return new_assignment

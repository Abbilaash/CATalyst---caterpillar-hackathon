from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from typing import List

from app.db.postgres import get_db
from app.models.postgres.core import RentalRequest, Rental, Asset
from app.schemas.workflows import RentalApproveRequest, RentalResponse
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/requests")
async def view_requests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RentalRequest).where(RentalRequest.status == "pending"))
    requests = result.scalars().all()
    return requests

@router.post("/allocate", response_model=List[RentalResponse])
async def allocate_machinery(approve_req: RentalApproveRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch the request
    req_result = await db.execute(select(RentalRequest).where(RentalRequest.request_id == approve_req.request_id))
    rental_req = req_result.scalar_one_or_none()
    
    if not rental_req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if rental_req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    # 2. Update request status
    rental_req.status = "approved"

    rentals = []
    # 3. Create rentals for allocated assets
    for asset_id in approve_req.asset_ids:
        # Mark asset as rented (status becomes idle until assigned a task, store assigned manager)
        await db.execute(
            update(Asset).where(Asset.asset_id == asset_id).values(
                current_status="idle",
                current_site_id=rental_req.site_id,
                assigned_site_manager=rental_req.manager_id
            )
        )
        
        # Create rental record
        new_rental = Rental(
            asset_id=asset_id,
            assigned_site_manager=rental_req.manager_id,
            check_in_time=approve_req.check_in_time or datetime.utcnow(),
            check_out_time=approve_req.check_out_time,
            expected_return=rental_req.requested_end_date,
            rental_status="active"
        )
        db.add(new_rental)
        rentals.append(new_rental)

    await db.commit()
    
    # Refresh to return
    for r in rentals:
        await db.refresh(r)
        
    return rentals

from app.schemas.workflows import ManualCheckInRequest, ManualCheckOutRequest

@router.post("/rentals/checkin", response_model=RentalResponse)
async def manual_check_in(req: ManualCheckInRequest, db: AsyncSession = Depends(get_db)):
    # Find asset
    result = await db.execute(select(Asset).where(Asset.asset_id == req.asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    # Mark asset as rented
    await db.execute(
        update(Asset).where(Asset.asset_id == req.asset_id).values(
            current_status="idle",
            assigned_site_manager=req.manager_id
        )
    )
    
    # Create rental record
    new_rental = Rental(
        asset_id=req.asset_id,
        assigned_site_manager=req.manager_id,
        check_in_time=req.check_in_date,
        check_out_time=None,
        expected_return=req.check_out_date,
        rental_status="active"
    )
    db.add(new_rental)
    await db.commit()
    await db.refresh(new_rental)
    
    return new_rental

@router.post("/rentals/checkout")
async def manual_check_out(req: ManualCheckOutRequest, db: AsyncSession = Depends(get_db)):
    # Find active rental
    result = await db.execute(
        select(Rental).where(
            (Rental.asset_id == req.asset_id) & 
            (Rental.rental_status == "active")
        )
    )
    rental = result.scalar_one_or_none()
    if not rental:
        raise HTTPException(status_code=404, detail="No active rental found for this asset")
        
    # Update rental
    rental.rental_status = "completed"
    rental.check_out_time = datetime.utcnow()
    
    # Update asset
    await db.execute(
        update(Asset).where(Asset.asset_id == req.asset_id).values(
            current_status="yard",
            assigned_site_manager=None,
            current_site_id=None
        )
    )
    
    await db.commit()
    return {"message": "Asset successfully checked out and returned to yard."}

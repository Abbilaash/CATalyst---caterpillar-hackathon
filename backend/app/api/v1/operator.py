from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from app.db.postgres import get_db
from app.models.postgres.core import Asset, Assignment, QRScanLog
from app.schemas.workflows import QRScanRequest, QRScanResponse

router = APIRouter()

@router.post("/scan", response_model=QRScanResponse)
async def scan_qr_code(scan_req: QRScanRequest, db: AsyncSession = Depends(get_db)):
    # 1. Mock operator ID (in real app, this comes from JWT)
    operator_id = "operator-mock-id"

    # 2. Find asset by QR code
    asset_result = await db.execute(select(Asset).where(Asset.qr_code == scan_req.qr_code))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Invalid QR Code - Asset not found")

    # 3. Check if operator has a valid time-bound assignment for this asset right now
    now = datetime.utcnow()
    assignment_result = await db.execute(
        select(Assignment).where(
            Assignment.asset_id == asset.asset_id,
            Assignment.operator_id == operator_id,
            Assignment.start_time <= now,
            Assignment.end_time >= now,
            Assignment.assignment_status == 'active'
        )
    )
    assignment = assignment_result.scalar_one_or_none()

    if not assignment:
        # Log failed scan
        log = QRScanLog(
            asset_id=asset.asset_id,
            operator_id=operator_id,
            scan_type=scan_req.scan_type,
            location=scan_req.location,
            result="failed_unauthorized"
        )
        db.add(log)
        await db.commit()
        
        raise HTTPException(status_code=403, detail="Access Denied: No active assignment for this time window")

    # 4. Log successful scan
    log = QRScanLog(
        asset_id=asset.asset_id,
        operator_id=operator_id,
        scan_type=scan_req.scan_type,
        location=scan_req.location,
        result="success"
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return QRScanResponse(
        scan_id=log.scan_id,
        asset_id=asset.asset_id,
        result="success",
        message=f"Access Granted to {asset.asset_name}"
    )

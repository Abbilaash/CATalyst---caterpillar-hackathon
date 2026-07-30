from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ================================
# ASSETS
# ================================
class AssetResponse(BaseModel):
    asset_id: str
    asset_name: str
    equipment_type: str
    current_status: str
    total_engine_hours: float
    current_site_id: Optional[str]

    class Config:
        from_attributes = True

# ================================
# RENTAL REQUESTS
# ================================
class RentalRequestCreate(BaseModel):
    equipment_type: str
    quantity: int = 1
    requested_start_date: datetime
    requested_end_date: datetime

class RentalRequestResponse(BaseModel):
    request_id: str
    site_id: str
    manager_id: str
    equipment_type: str
    quantity: int
    requested_start_date: datetime
    requested_end_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ================================
# RENTALS (DEALER APPROVAL)
# ================================
class RentalApproveRequest(BaseModel):
    request_id: str
    asset_ids: List[str] # Dealer selects specific assets to fulfill the request

class RentalResponse(BaseModel):
    rental_id: str
    asset_id: str
    site_id: str
    check_in_time: datetime
    expected_return: datetime
    rental_status: str

    class Config:
        from_attributes = True

# ================================
# ASSIGNMENTS
# ================================
class AssignmentCreate(BaseModel):
    asset_id: str
    operator_id: str
    job_title: str
    start_time: datetime
    end_time: datetime

class AssignmentResponse(BaseModel):
    assignment_id: str
    asset_id: str
    operator_id: str
    job_title: str
    start_time: datetime
    end_time: datetime
    assignment_status: str

    class Config:
        from_attributes = True

# ================================
# QR SCAN LOGS
# ================================
class QRScanRequest(BaseModel):
    qr_code: str
    scan_type: str # 'check-in' or 'check-out'
    location: Optional[str] = None

class QRScanResponse(BaseModel):
    scan_id: str
    asset_id: str
    result: str # 'success', 'failed_unauthorized', etc.
    message: str

    class Config:
        from_attributes = True

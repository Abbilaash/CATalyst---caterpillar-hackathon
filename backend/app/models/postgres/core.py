import uuid
from sqlalchemy import Column, String, Float, Integer, Date, DateTime, Boolean, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.postgres import Base

def generate_uuid():
    return str(uuid.uuid4())

class Site(Base):
    __tablename__ = "sites"
    
    site_id = Column(String, primary_key=True, default=generate_uuid)
    site_name = Column(String, nullable=False)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    manager_id = Column(String) # From Mongo
    status = Column(String, default="active")
    
    assets = relationship("Asset", back_populates="current_site")

class Asset(Base):
    __tablename__ = "assets"
    
    asset_id = Column(String, primary_key=True, default=generate_uuid)
    qr_code = Column(String, unique=True)
    rfid_tag = Column(String, unique=True)
    asset_name = Column(String, nullable=False)
    equipment_type = Column(String)
    manufacturer = Column(String)
    model = Column(String)
    serial_number = Column(String, unique=True)
    purchase_year = Column(Integer)
    engine_type = Column(String)
    current_site_id = Column(String, ForeignKey("sites.site_id"), nullable=True)
    current_status = Column(String, default="available") # rented, available, maintenance
    total_engine_hours = Column(Float, default=0.0)
    fuel_capacity = Column(Float)
    last_service_date = Column(Date)
    next_service_due = Column(Date)
    image_url = Column(String)

    current_site = relationship("Site", back_populates="assets")
    rentals = relationship("Rental", back_populates="asset")
    assignments = relationship("Assignment", back_populates="asset")

class RentalRequest(Base):
    __tablename__ = "rental_requests"
    
    request_id = Column(String, primary_key=True, default=generate_uuid)
    site_id = Column(String, ForeignKey("sites.site_id"))
    manager_id = Column(String) # Mongo ID
    dealer_id = Column(String, nullable=True) # Mongo ID
    equipment_type = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    requested_start_date = Column(DateTime)
    requested_end_date = Column(DateTime)
    status = Column(String, default="pending") # pending, approved, rejected, fulfilled
    created_at = Column(DateTime, server_default=func.now())

class Rental(Base):
    __tablename__ = "rentals"
    
    rental_id = Column(String, primary_key=True, default=generate_uuid)
    asset_id = Column(String, ForeignKey("assets.asset_id"))
    site_id = Column(String, ForeignKey("sites.site_id"))
    assigned_operator = Column(String) # Mongo operator_id
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime, nullable=True)
    expected_return = Column(DateTime)
    actual_return = Column(DateTime, nullable=True)
    rental_status = Column(String, default="active") # active, returned, overdue
    remarks = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="rentals")
    site = relationship("Site")

class Assignment(Base):
    __tablename__ = "assignments"
    
    assignment_id = Column(String, primary_key=True, default=generate_uuid)
    asset_id = Column(String, ForeignKey("assets.asset_id"))
    operator_id = Column(String) # Mongo ID
    manager_id = Column(String) # Mongo ID
    job_title = Column(String)
    job_description = Column(Text)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    assignment_status = Column(String, default="scheduled") # scheduled, active, completed, cancelled

    asset = relationship("Asset", back_populates="assignments")

class QRScanLog(Base):
    __tablename__ = "qr_scan_logs"
    
    scan_id = Column(String, primary_key=True, default=generate_uuid)
    asset_id = Column(String, ForeignKey("assets.asset_id"))
    operator_id = Column(String) # Mongo ID
    scan_time = Column(DateTime, server_default=func.now())
    scan_type = Column(String) # check-in, check-out
    location = Column(String) # GPS coordinates as string or json
    result = Column(String) # success, failed_unauthorized, failed_time_mismatch

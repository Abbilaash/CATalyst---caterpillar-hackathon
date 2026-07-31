from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, BigInteger, func, Boolean
from sqlalchemy.orm import relationship
from app.db.postgres import Base

# Telemetry tables for TimescaleDB. These need to be converted to hypertables via Alembic

class Telemetry(Base):
    __tablename__ = "telemetry"
    
    telemetry_id = Column(BigInteger, primary_key=True, autoincrement=True)
    asset_id = Column(String(50), ForeignKey("assets.asset_id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    altitude = Column(Float)
    heading = Column(Float)
    speed_kmph = Column(Float)
    
    # Engine
    engine_status = Column(Boolean)
    engine_rpm = Column(Integer)
    engine_hours = Column(Float)
    idle_hours = Column(Float)
    
    # Fuel
    fuel_level_percent = Column(Float)
    fuel_remaining_liters = Column(Float)
    fuel_consumption_lph = Column(Float)
    
    # Temperatures
    engine_temperature = Column(Float)
    coolant_temperature = Column(Float)
    hydraulic_oil_temperature = Column(Float)
    
    # Hydraulic System
    hydraulic_pressure = Column(Float)
    
    # Machine Operation
    payload_tons = Column(Float)
    bucket_position_percent = Column(Float)
    boom_height = Column(Float)
    
    # Electrical
    battery_voltage = Column(Float)
    
    # Status
    operating_mode = Column(String(30))
    ignition_status = Column(Boolean)

class EngineEvent(Base):
    __tablename__ = "engine_events"
    
    timestamp = Column(DateTime(timezone=True), primary_key=True, default=func.now())
    asset_id = Column(String, primary_key=True)
    event_id = Column(BigInteger, autoincrement=True, unique=True)
    
    event_type = Column(String)
    event_value = Column(String)
    severity = Column(String)

class SensorHealth(Base):
    __tablename__ = "sensor_health"
    
    timestamp = Column(DateTime(timezone=True), primary_key=True, default=func.now())
    asset_id = Column(String, primary_key=True)
    sensor_id = Column(BigInteger, autoincrement=True, unique=True)
    
    gps_status = Column(String)
    temperature_sensor = Column(String)
    fuel_sensor = Column(String)
    battery_sensor = Column(String)
    network_status = Column(String)

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, BigInteger, func
from sqlalchemy.orm import relationship
from app.db.postgres import Base

# Telemetry tables for TimescaleDB. These need to be converted to hypertables via Alembic

class Telemetry(Base):
    __tablename__ = "telemetry"
    
    # In TimescaleDB, the timestamp is part of the composite primary key or index, 
    # but we can use a composite PK of (timestamp, asset_id)
    timestamp = Column(DateTime(timezone=True), primary_key=True, default=func.now())
    asset_id = Column(String, primary_key=True)
    telemetry_id = Column(BigInteger, autoincrement=True, unique=True)
    
    latitude = Column(Float)
    longitude = Column(Float)
    speed = Column(Float)
    engine_hours = Column(Float)
    fuel_level = Column(Float)
    engine_temperature = Column(Float)
    oil_pressure = Column(Float)
    rpm = Column(Float)
    battery_voltage = Column(Float)
    idle_hours = Column(Float)
    runtime_today = Column(Float)
    operator_id = Column(String) # Mongo ID
    site_id = Column(String) # Postgres site ID
    network_strength = Column(Integer)

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

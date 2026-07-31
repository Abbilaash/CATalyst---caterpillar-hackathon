-- ============================================================================
-- CATERPILLAR EQUIPMENT MONITORING SYSTEM - TIMESCALEDB SCHEMA
-- ============================================================================

-- 1. Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Drop existing tables if recreating
DROP TABLE IF EXISTS telemetry CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- 3. Create Assets Table for static machine information
CREATE TABLE assets (
    asset_id                        VARCHAR(64) PRIMARY KEY,
    name                            VARCHAR(128) NOT NULL,
    model                           VARCHAR(64) NOT NULL,
    equipment_type                  VARCHAR(64) NOT NULL,
    fuel_capacity                   NUMERIC(8, 2) NOT NULL,
    max_payload_tons                NUMERIC(6, 2) NOT NULL
);

-- Seed static Caterpillar machine assets
INSERT INTO assets (asset_id, name, model, equipment_type, fuel_capacity, max_payload_tons)
VALUES 
    ('CAT-EXC-349', 'CAT 349 Hydraulic Excavator', '349 UHD', 'Hydraulic Excavator', 350.00, 15.00),
    ('CAT-DOZ-D11', 'CAT D11 Mining Dozer', 'D11 Heavy Tractor', 'Track-Type Tractor', 500.00, 25.00),
    ('CAT-TRK-797F', 'CAT 797F Mining Truck', '797F Off-Highway', 'Off-Highway Truck', 700.00, 400.00)
ON CONFLICT (asset_id) DO NOTHING;

-- 4. Create Telemetry Table with EXACT requested schema
CREATE TABLE telemetry (
    telemetry_id                    BIGSERIAL,
    asset_id                        VARCHAR(64) NOT NULL REFERENCES assets(asset_id),
    timestamp                       TIMESTAMPTZ NOT NULL,

    -- Location & Motion
    latitude                        NUMERIC(10, 6),
    longitude                       NUMERIC(10, 6),
    altitude                        NUMERIC(8, 2),
    heading                         NUMERIC(5, 2),
    speed_kmph                      NUMERIC(6, 2),

    -- Engine & Usage
    engine_status                   VARCHAR(16),  -- ON, OFF
    ignition_status                 VARCHAR(16),  -- ON, OFF
    engine_rpm                      INTEGER,
    engine_hours                    NUMERIC(10, 4),
    idle_hours                      NUMERIC(10, 4),

    -- Fuel Metrics
    fuel_level_percent              NUMERIC(5, 2),
    fuel_remaining_liters           NUMERIC(8, 2),
    fuel_consumption_lph            NUMERIC(6, 2),

    -- Thermal & Hydraulics
    engine_temperature              NUMERIC(5, 2),
    coolant_temperature             NUMERIC(5, 2),
    hydraulic_oil_temperature       NUMERIC(5, 2),
    hydraulic_pressure              NUMERIC(8, 2),

    -- Payload & Work Equipment
    payload_tons                    NUMERIC(6, 2),
    bucket_position_percent         NUMERIC(5, 2),
    boom_height                     NUMERIC(5, 2),

    -- Electrical
    battery_voltage                 NUMERIC(4, 2),

    -- Operational Mode
    operating_mode                  VARCHAR(32),  -- Idle, Working, Travelling

    PRIMARY KEY (asset_id, timestamp)
);

-- 5. Convert telemetry table into a TimescaleDB Hypertable partitioned by timestamp
SELECT create_hypertable('telemetry', 'timestamp', if_not_exists => TRUE);

-- 6. Optimized Indexes
CREATE INDEX idx_telemetry_asset_time ON telemetry (asset_id, timestamp DESC);
CREATE INDEX idx_telemetry_mode ON telemetry (operating_mode, timestamp DESC);

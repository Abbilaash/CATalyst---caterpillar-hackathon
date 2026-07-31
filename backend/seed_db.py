import asyncio
import os
import sys
import io

# Fix Windows console encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from motor.motor_asyncio import AsyncIOMotorClient
AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from beanie import init_beanie
from app.models.mongo.users import User, Operator, SiteManager, Dealer, Notification, LoginHistory
from app.core.security import get_password_hash
from app.db.postgres import engine
from sqlalchemy import text
from datetime import datetime, timedelta

async def seed():
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    db = await get_database()
    await init_beanie(database=db, document_models=[User, Operator, SiteManager, Dealer, Notification, LoginHistory])

    print("Clearing existing users and operators for a fresh start...")
    # Clean operator profiles and user records
    operators_list = [
        "marcus@caterpillar.com", "dana@caterpillar.com", "hiroshi@caterpillar.com",
        "priya@caterpillar.com", "tom@caterpillar.com", "sofia@caterpillar.com",
        "kwame@caterpillar.com", "elena@caterpillar.com"
    ]
    await User.find({"email": {"$in": operators_list + ["manager@caterpillar.com", "dealer@caterpillar.com"]}}).delete()
    await Operator.delete_all()
    await SiteManager.delete_all()
    await Dealer.delete_all()

    password = "test123"
    hashed_pwd = get_password_hash(password)

    print("Creating site manager & dealer...")
    # 1. Dealer
    dealer_user = User(
        name="Apex Machinery (Dealer)", 
        email="dealer@caterpillar.com", 
        password_hash=hashed_pwd, 
        role="dealer"
    )
    await dealer_user.insert()
    dealer = Dealer(user=dealer_user, company_name="Apex Machinery", address="123 Industrial Ave")
    await dealer.insert()

    # 2. Site Manager
    manager_user = User(
        name="Liam Carmichael", 
        email="manager@caterpillar.com", 
        password_hash=hashed_pwd, 
        role="site_manager"
    )
    await manager_user.insert()

    print("Creating 8 operators...")
    # 3. Operators
    OPERATORS_DATA = [
        {"name": "Marcus Reyes",   "email": "marcus@caterpillar.com",  "phone": "+1-555-0101", "license": "LIC-2241", "exp": 7,  "site": "site-01", "status": "on_duty",   "certs": ["Excavator", "Dozer", "Loader"]},
        {"name": "Dana Whitfield", "email": "dana@caterpillar.com",    "phone": "+1-555-0102", "license": "LIC-2242", "exp": 11, "site": "site-02", "status": "on_duty",   "certs": ["Dozer", "Grader"]},
        {"name": "Hiroshi Tanaka", "email": "hiroshi@caterpillar.com", "phone": "+1-555-0103", "license": "LIC-2243", "exp": 5,  "site": "site-01", "status": "available", "certs": ["Loader", "Compactor"]},
        {"name": "Priya Nair",     "email": "priya@caterpillar.com",   "phone": "+1-555-0104", "license": "LIC-2244", "exp": 9,  "site": "site-03", "status": "on_duty",   "certs": ["Loader", "Excavator"]},
        {"name": "Tom Becker",     "email": "tom@caterpillar.com",     "phone": "+1-555-0105", "license": "LIC-2245", "exp": 14, "site": "site-02", "status": "off_duty",  "certs": ["Grader", "Scraper"]},
        {"name": "Sofia Marquez",  "email": "sofia@caterpillar.com",   "phone": "+1-555-0106", "license": "LIC-2246", "exp": 6,  "site": "site-01", "status": "on_duty",   "certs": ["Excavator"]},
        {"name": "Kwame Osei",     "email": "kwame@caterpillar.com",   "phone": "+1-555-0107", "license": "LIC-2247", "exp": 8,  "site": "site-02", "status": "on_duty",   "certs": ["Loader", "Truck"]},
        {"name": "Elena Petrov",   "email": "elena@caterpillar.com",   "phone": "+1-555-0108", "license": "LIC-2248", "exp": 12, "site": "site-03", "status": "off_duty",  "certs": ["Dozer", "Compactor"]},
    ]

    OP_ID = {}
    for i, data in enumerate(OPERATORS_DATA):
        op_user = User(
            name=data["name"],
            email=data["email"],
            phone=data["phone"],
            password_hash=hashed_pwd,
            role="operator",
            status="active"
        )
        await op_user.insert()
        
        op = Operator(
            user=op_user,
            license_number=data["license"],
            experience_years=data["exp"],
            assigned_site_id=data["site"],
            status=data["status"],
            certified_equipment_types=data["certs"]
        )
        await op.insert()
        OP_ID[f"op-{i+1:02d}"] = str(op_user.id)

    # Link manager to sites
    manager = SiteManager(
        user=manager_user, 
        designation="Lead Manager", 
        site_ids=["site-01", "site-02", "site-03"]
    )
    await manager.insert()

    # Seed Postgres base data (Site and Asset)
    print("Seeding PostgreSQL base data & updating schema...")
    async with engine.begin() as conn:
        # Run schema migrations
        await conn.execute(text("ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_site_id_fkey;"))
        await conn.execute(text("ALTER TABLE rentals DROP COLUMN IF EXISTS site_id;"))
        await conn.execute(text("ALTER TABLE assets ADD COLUMN IF NOT EXISTS total_runtime FLOAT DEFAULT 16.0;"))
        await conn.execute(text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS importance VARCHAR DEFAULT 'medium';"))
        await conn.execute(text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT FALSE;"))
        # Rename assigned_operator -> assigned_site_manager in rentals table (idempotent)
        await conn.execute(text("""
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rentals' AND column_name='assigned_operator') THEN
                    ALTER TABLE rentals RENAME COLUMN assigned_operator TO assigned_site_manager;
                END IF;
            END $$;
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS assignments_queue (
                queue_id VARCHAR PRIMARY KEY,
                manager_id VARCHAR NOT NULL,
                equipment_type VARCHAR NOT NULL,
                job_title VARCHAR NOT NULL,
                job_description TEXT,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                total_hours FLOAT NOT NULL,
                importance VARCHAR NOT NULL DEFAULT 'medium',
                priority BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS interrupted_assignments (
                interrupt_id VARCHAR PRIMARY KEY,
                assignment_id VARCHAR NOT NULL,
                asset_id VARCHAR NOT NULL REFERENCES assets(asset_id),
                operator_id VARCHAR NOT NULL,
                manager_id VARCHAR NOT NULL,
                job_title VARCHAR NOT NULL,
                job_description TEXT,
                original_start_time TIMESTAMP NOT NULL,
                original_end_time TIMESTAMP NOT NULL,
                interrupted_at TIMESTAMP NOT NULL DEFAULT NOW(),
                interrupt_reason VARCHAR NOT NULL,
                interrupt_detail TEXT,
                status VARCHAR DEFAULT 'pending',
                importance VARCHAR DEFAULT 'medium',
                priority BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """))
        
        # Clear existing
        await conn.execute(text("TRUNCATE TABLE assignments, qr_scan_logs, rental_requests, rentals, assets, sites, interrupted_assignments CASCADE;"))
        
        # Insert Sites
        await conn.execute(text("""
            INSERT INTO sites (site_id, site_name, address, latitude, longitude, manager_id, status) VALUES
            ('site-01', 'Highland Quarry',         'Edinburgh, UK', 55.9533, -3.1883,   :mid, 'active'),
            ('site-02', 'Meridian Dam',            'Phoenix, AZ',   33.4484, -112.0740, :mid, 'active'),
            ('site-03', 'Northwind Construction',  'Calgary, CA',   51.0447, -114.0719, :mid, 'active')
        """), {"mid": str(manager_user.id)})
        
        # Insert Assets
        # All rented assets start 'idle' (rented but no task assigned yet). eq-7 has no rental, so 'available'.
        mid_val = str(manager_user.id)
        await conn.execute(text("""
            INSERT INTO assets (asset_id, qr_code, rfid_tag, asset_name, equipment_type, manufacturer, model, serial_number, purchase_year, engine_type, current_status, total_engine_hours, fuel_capacity, assigned_site_manager, max_payload_tons) VALUES
            ('eq-1', 'QR-320-001', 'RFID-320-001', 'CAT 320 Hydraulic Excavator',  'Excavator',      'Caterpillar', '320 GC',  'MX-320-001', 2022, 'Diesel', 'idle',      3820.0, 400.0, :mid, 1.2),
            ('eq-2', 'QR-D6-014',  'RFID-D6-014',  'CAT D6 Dozer',                 'Dozer',          'Caterpillar', 'D6',      'MX-D6-014',  2021, 'Diesel', 'idle',      5210.0, 500.0, :mid, 4.0),
            ('eq-3', 'QR-950-007', 'RFID-950-007', 'CAT 950 GC Wheel Loader',      'Wheel Loader',   'Caterpillar', '950 GC',  'MX-950-007', 2023, 'Diesel', 'idle',      2740.0, 350.0, :mid, 5.0),
            ('eq-4', 'QR-420-022', 'RFID-420-022', 'CAT 420 Backhoe Loader',       'Backhoe Loader', 'Caterpillar', '420F2',   'MX-420-022', 2022, 'Diesel', 'idle',      1980.0, 280.0, :mid, 1.0),
            ('eq-5', 'QR-140-009', 'RFID-140-009', 'CAT 140 Motor Grader',         'Motor Grader',   'Caterpillar', '140 GC',  'MX-140-009', 2020, 'Diesel', 'idle',      6420.0, 450.0, :mid, 3.0),
            ('eq-6', 'QR-336-003', 'RFID-336-003', 'CAT 336 Hydraulic Excavator',  'Excavator',      'Caterpillar', '336 GC',  'MX-336-003', 2023, 'Diesel', 'idle',      4110.0, 480.0, :mid, 2.2),
            ('eq-7', 'QR-966-011', 'RFID-966-011', 'CAT 966M Wheel Loader',        'Wheel Loader',   'Caterpillar', '966M',    'MX-966-011', 2024, 'Diesel', 'available', 980.0,  380.0, NULL, 6.5),
            ('eq-8', 'QR-D8-018',  'RFID-D8-018',  'CAT D8 Dozer',                 'Dozer',          'Caterpillar', 'D8T',     'MX-D8-018',  2019, 'Diesel', 'idle',      7320.0, 550.0, :mid, 8.0)
        """), {
            "mid": mid_val
        })

        # Insert Rentals (assigned_site_manager = the manager who rented the asset)
        mgr_id = str(manager_user.id)
        await conn.execute(text("""
            INSERT INTO rentals (rental_id, asset_id, assigned_site_manager, check_in_time, expected_return, rental_status) VALUES
            ('rnt-01', 'eq-1', :mid, '2026-07-28 08:00:00', '2026-08-15 18:00:00', 'active'),
            ('rnt-02', 'eq-2', :mid, '2026-07-28 08:00:00', '2026-08-20 18:00:00', 'active'),
            ('rnt-03', 'eq-3', :mid, '2026-07-29 08:00:00', '2026-08-10 18:00:00', 'active'),
            ('rnt-04', 'eq-4', :mid, '2026-07-27 08:00:00', '2026-08-12 18:00:00', 'active'),
            ('rnt-05', 'eq-6', :mid, '2026-07-29 08:00:00', '2026-08-18 18:00:00', 'active'),
            ('rnt-06', 'eq-8', :mid, '2026-07-25 08:00:00', '2026-07-30 18:00:00', 'overdue')
        """), {
            "mid": mgr_id
        })

        # No pre-seeded assignments — manager adds tasks manually via the UI

    print("\n" + "="*50)
    print("SEEDING COMPLETE!")
    print("Here are your credentials:")
    print("="*50)
    print(f"DEALER        | Email: {dealer_user.email} | Password: {password}")
    print(f"SITE MANAGER  | Email: {manager_user.email} | Password: {password}")
    print(f"OPERATORS     | Password: {password} (Marcus: {OP_ID['op-01']})")
    print("="*50)
    
    await close_mongo_connection()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
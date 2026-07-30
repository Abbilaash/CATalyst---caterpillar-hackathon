import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import AsyncSessionLocal
from app.models.postgres.core import (
    Site, Asset, Rental, RentalRequest, Assignment, MaintenanceLog, QRScanLog
)
from app.models.postgres.telemetry import (
    Telemetry, EngineEvent, SensorHealth
)

def get_past_time(days_ago):
    return datetime.utcnow() - timedelta(days=days_ago)

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("Starting seeding process...")
        # 1. Create Sites
        sites = [
            Site(site_name="Site Alpha", address="Downtown NY", latitude=40.7128, longitude=-74.0060),
            Site(site_name="Site Bravo", address="Uptown NY", latitude=40.7306, longitude=-73.9866),
            Site(site_name="Site Charlie", address="Queens, NY", latitude=40.7282, longitude=-73.7949),
            Site(site_name="Site Delta", address="Brooklyn, NY", latitude=40.6782, longitude=-73.9442)
        ]
        db.add_all(sites)
        await db.commit()
        for site in sites:
            await db.refresh(site)
        print("Sites seeded.")

        # 2. Create Assets
        assets = []
        models = [
            ("CAT 320 Excavator", "Excavator", "CAT 320"),
            ("CAT 336 Excavator", "Excavator", "CAT 336"),
            ("CAT 980 Loader", "Loader", "CAT 980"),
            ("CAT 966 Loader", "Loader", "CAT 966"),
            ("CAT D6 Dozer", "Dozer", "CAT D6"),
            ("CAT D8 Dozer", "Dozer", "CAT D8"),
            ("CAT 14M Grader", "Grader", "CAT 14M"),
            ("CAT 631 Scraper", "Scraper", "CAT 631")
        ]
        
        for i in range(25):
            name, cat, model = random.choice(models)
            site = random.choice(sites)
            is_rented = random.choice([True, True, True, False]) # 75% rented
            status = "rented" if is_rented else "available"
            if random.random() < 0.1:
                status = "maintenance"
            asset = Asset(
                asset_name=f"{name} - {i+1}",
                equipment_type=cat,
                model=model,
                manufacturer="Caterpillar",
                current_site_id=site.site_id,
                current_status=status,
                fuel_capacity=random.randint(100, 300)
            )
            assets.append(asset)
            
        db.add_all(assets)
        await db.commit()
        for asset in assets:
            await db.refresh(asset)
        print("Assets seeded.")

        # 3. Create Rentals and Telemetry
        now = datetime.utcnow()
        telemetry_records = []
        rentals = []
        events = []
        m_logs = []
        
        for asset in assets:
            # Add Maintenance Log
            if asset.current_status == "maintenance" or random.random() < 0.3:
                m_logs.append(MaintenanceLog(
                    asset_id=asset.asset_id,
                    event=random.choice(["Oil change", "Hydraulic inspection", "Track adjustment"]),
                    date=now - timedelta(days=random.randint(1, 15)),
                    status="done"
                ))
            
            m_logs.append(MaintenanceLog(
                asset_id=asset.asset_id,
                event="Next service interval",
                date=now + timedelta(days=random.randint(5, 30)),
                status="upcoming"
            ))

            if asset.current_status == "rented":
                rentals.append(Rental(
                    asset_id=asset.asset_id,
                    site_id=asset.current_site_id,
                    assigned_operator=f"op_{random.randint(1,10)}",
                    check_in_time=now - timedelta(days=random.randint(1, 10)),
                    expected_return=now + timedelta(days=random.randint(1, 20)),
                    rental_status="active"
                ))
                
            # Telemetry for last 7 days (hourly)
            for day_offset in range(7):
                day = now - timedelta(days=day_offset)
                for hour in range(24):
                    t = day - timedelta(hours=hour)
                    idle_add = random.uniform(0.1, 0.5) if asset.current_status != 'rented' else 0
                    
                    telemetry_records.append(Telemetry(
                        timestamp=t,
                        asset_id=asset.asset_id,
                        latitude=random.uniform(40.5, 40.9),
                        longitude=random.uniform(-74.1, -73.7),
                        speed=random.uniform(0, 30),
                        engine_hours=random.uniform(1000, 5000) + (day_offset * 24 + hour),
                        fuel_level=random.uniform(10, 100),
                        battery_voltage=random.uniform(11, 14),
                        idle_hours=idle_add,
                        runtime_today=random.uniform(0, 8)
                    ))
                    
                    # Random engine events
                    if random.random() < 0.01:
                        severity = random.choice(["low", "medium", "critical"])
                        events.append(EngineEvent(
                            timestamp=t,
                            asset_id=asset.asset_id,
                            event_type="Warning",
                            event_value="High Temp" if severity == 'critical' else "Check Filter",
                            severity=severity
                        ))

        db.add_all(rentals)
        db.add_all(m_logs)
        # Add telemetry in chunks
        chunk_size = 5000
        for i in range(0, len(telemetry_records), chunk_size):
            db.add_all(telemetry_records[i:i+chunk_size])
            await db.commit()
            
        db.add_all(events)
        await db.commit()
        print("Rentals, Maintenance, Events, and Telemetry seeded.")

if __name__ == "__main__":
    asyncio.run(seed_data())

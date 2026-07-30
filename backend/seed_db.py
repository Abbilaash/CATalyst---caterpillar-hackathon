import asyncio
import os
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from beanie import init_beanie
from app.models.mongo.users import User, Operator, SiteManager, Dealer, Notification, LoginHistory
from app.core.security import get_password_hash
from app.db.postgres import engine
from sqlalchemy import text

async def seed():
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    db = await get_database()
    await init_beanie(database=db, document_models=[User, Operator, SiteManager, Dealer, Notification, LoginHistory])

    print("Clearing existing users for a fresh start...")
    await User.delete_all()
    await Operator.delete_all()
    await SiteManager.delete_all()
    await Dealer.delete_all()

    password = "password123"
    hashed_pwd = get_password_hash(password)

    print("Creating mock users...")

    # 1. Dealer
    dealer_user = User(
        name="Apex Machinery (Dealer)", 
        email="dealer@example.com", 
        password_hash=hashed_pwd, 
        role="dealer"
    )
    await dealer_user.insert()
    dealer = Dealer(user=dealer_user, company_name="Apex Machinery", address="123 Industrial Ave")
    await dealer.insert()

    # 2. Site Manager
    manager_user = User(
        name="Sarah Connor (Site Manager)", 
        email="manager@example.com", 
        password_hash=hashed_pwd, 
        role="site_manager"
    )
    await manager_user.insert()
    
    # 3. Operator
    operator_user = User(
        name="John Smith (Operator)", 
        email="operator@example.com", 
        password_hash=hashed_pwd, 
        role="operator"
    )
    await operator_user.insert()
    op = Operator(user=operator_user, license_number="LIC998877", experience_years=5)
    await op.insert()

    # Seed Postgres base data (Site and Asset)
    print("Seeding PostgreSQL base data...")
    async with engine.begin() as conn:
        # Clear existing
        await conn.execute(text("TRUNCATE TABLE assignments, qr_scan_logs, rental_requests, rentals, assets, sites CASCADE;"))
        
        # Create a Site
        site_id = "site-001"
        await conn.execute(
            text("INSERT INTO sites (site_id, site_name, address, manager_id, status) VALUES (:id, :name, :addr, :mid, :status)"),
            {"id": site_id, "name": "Downtown Construction", "addr": "456 City Center", "mid": str(manager_user.id), "status": "active"}
        )
        
        # SiteManager model in Mongo needs to link to this site
        manager = SiteManager(user=manager_user, designation="Lead Manager", site_ids=[site_id])
        await manager.insert()

        # Create an Asset (Excavator) available at dealer
        asset_id = "EQX-1001"
        await conn.execute(
            text("""
            INSERT INTO assets (asset_id, qr_code, asset_name, equipment_type, manufacturer, model, current_status) 
            VALUES (:id, :qr, :name, :type, :mfg, :model, :status)
            """),
            {"id": asset_id, "qr": "QR-EQX-1001", "name": "Cat 320 Excavator", "type": "Excavator", "mfg": "Caterpillar", "model": "320", "status": "available"}
        )

    print("\n" + "="*50)
    print("SEEDING COMPLETE!")
    print("Here are your mock user credentials to test with:")
    print("="*50)
    print(f"DEALER        | Email: {dealer_user.email} | Password: {password}")
    print(f"SITE MANAGER  | Email: {manager_user.email} | Password: {password}")
    print(f"OPERATOR      | Email: {operator_user.email} | Password: {password}")
    print("="*50)
    
    await close_mongo_connection()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())

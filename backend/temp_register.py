import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from beanie import init_beanie
from app.models.mongo.users import User, Operator, SiteManager, Dealer, Notification, LoginHistory

async def main():
    await connect_to_mongo()
    db = None
    try:
        from app.db.mongodb import get_database
        db = await get_database()
        await init_beanie(database=db, document_models=[User, Operator, SiteManager, Dealer, Notification, LoginHistory])

        existing = await User.find_one({"email": "manager@caterpilar@gmail.com"})
        if existing:
            print("User already exists")
            return

        user = User(
            name="Site Manager",
            email="manager@caterpilar@gmail.com",
            phone="",
            password_hash="test123",
            role="site_manager"
        )
        await user.insert()
        sm = SiteManager(user=user, designation="Site Manager")
        await sm.insert()
        print({"id": str(user.id), "email": user.email, "role": user.role})
    finally:
        await close_mongo_connection()

asyncio.run(main())

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None

db = MongoDB()

async def get_database():
    return db.client.get_default_database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGO_URI)
    # Ping the server to verify the connection is actually working
    await db.client.admin.command('ping')
    print("*" * 50)
    print("SUCCESS: Connected to MongoDB Atlas Database!")
    print("*" * 50)

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")

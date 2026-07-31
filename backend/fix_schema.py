import asyncio
from app.db.postgres import engine
from app.models.postgres.telemetry import Telemetry
from app.models.postgres.core import Base

async def fix_schema():
    async with engine.begin() as conn:
        print("Dropping telemetry table...")
        await conn.run_sync(Telemetry.__table__.drop, checkfirst=True)
        print("Recreating tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Schema fix complete!")

asyncio.run(fix_schema())

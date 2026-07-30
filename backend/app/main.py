from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from beanie import init_beanie
from app.db.mongodb import get_database
from app.models.mongo.users import User, Operator, SiteManager, Dealer, Notification, LoginHistory
from app.api.v1 import auth, site_manager, dealer, operator
from app.db.postgres import engine
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup MongoDB
    await connect_to_mongo()
    db = await get_database()
    await init_beanie(database=db, document_models=[User, Operator, SiteManager, Dealer, Notification, LoginHistory])
    
    # Startup PostgreSQL
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        
        # Automatically create all Postgres tables if they don't exist
        from app.models.postgres.core import Base
        await conn.run_sync(Base.metadata.create_all)
    print("*" * 50)
    print("SUCCESS: Connected to Local PostgreSQL Database!")
    print("*" * 50)
    
    yield
    # Shutdown
    await close_mongo_connection()
    await engine.dispose()

app = FastAPI(title="Smart Rental Tracking API", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Rental Tracking API"}

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(site_manager.router, prefix="/api/v1/manager", tags=["Site Manager Workflows"])
app.include_router(dealer.router, prefix="/api/v1/dealer", tags=["Dealer Workflows"])
app.include_router(operator.router, prefix="/api/v1/operator", tags=["Operator Workflows"])

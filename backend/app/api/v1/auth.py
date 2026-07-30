from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.models.mongo.users import User, Operator, SiteManager, Dealer
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(user_in: UserCreate):
    existing_user = await User.find_one(User.email == user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=hashed_password,
        role=user_in.role
    )
    await user.insert()
    
    # Depending on role, create specific profile
    if user.role == "operator":
        op = Operator(user=user, license_number="TBD", experience_years=0)
        await op.insert()
    elif user.role == "site_manager":
        sm = SiteManager(user=user, designation="Site Manager")
        await sm.insert()
    elif user.role == "dealer":
        dl = Dealer(user=user, company_name="Dealer Co", address="TBD")
        await dl.insert()

    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        status=user.status
    )

@router.post("/login")
async def login(user_in: UserLogin):
    user = await User.find_one(User.email == user_in.email)
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "role": user.role,
        "name": user.name
    }

from pydantic import BaseModel as PydanticBaseModel

class PushTokenRequest(PydanticBaseModel):
    user_id: str
    token: str

@router.post("/push-token")
async def register_push_token(req: PushTokenRequest):
    user = await User.find_one(User.email == req.user_id)
    if not user:
        # Try by ID string
        from bson import ObjectId
        try:
            user = await User.get(ObjectId(req.user_id))
        except Exception:
            raise HTTPException(status_code=404, detail="User not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.expo_push_token = req.token
    await user.save()
    return {"status": "ok", "message": "Push token registered"}

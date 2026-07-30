from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel as PydanticBaseModel
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.models.mongo.users import User, Operator, SiteManager, Dealer
from app.core.security import create_access_token

router = APIRouter()

class UserProfileResponse(PydanticBaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    status: str
    password: str = ""
    expo_push_token: Optional[str] = None
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class UserProfileUpdate(PydanticBaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None
    expo_push_token: Optional[str] = None

async def resolve_user(user_id: str) -> User:
    if user_id.lower() == "manager":
        user = await User.find_one({"role": "site_manager"})
    else:
        try:
            user = await User.get(ObjectId(user_id))
        except Exception:
            user = await User.find_one({"email": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def serialize_user(user: User) -> UserProfileResponse:
    return UserProfileResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone or "",
        role=user.role,
        status=user.status,
        password="",
        expo_push_token=user.expo_push_token,
        created_at=user.created_at.isoformat() if getattr(user, "created_at", None) else None,
        last_login=user.last_login.isoformat() if getattr(user, "last_login", None) else None,
    )

@router.post("/register", response_model=UserResponse)
async def register_user(user_in: UserCreate):
    existing_user = await User.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=user_in.password,
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

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    user = await User.find_one({"email": user_in.email})
    if not user or user.password_hash != user_in.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify profile existence in role-specific collections
    if user.role == "site_manager":
        sm = await SiteManager.find_one({"user.$id": user.id})
        if not sm:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Site Manager profile not found"
            )
    elif user.role == "operator":
        op = await Operator.find_one({"user.$id": user.id})
        if not op:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Operator profile not found"
            )
            
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/profile/manager", response_model=UserProfileResponse)
async def get_manager_profile():
    user = await resolve_user("manager")
    return serialize_user(user)

@router.put("/profile/manager", response_model=UserProfileResponse)
async def update_manager_profile(user_update: UserProfileUpdate):
    user = await resolve_user("manager")
    if user_update.email and user_update.email != user.email:
        existing_user = await User.find_one({"email": user_update.email})
        if existing_user and str(existing_user.id) != str(user.id):
            raise HTTPException(status_code=400, detail="Email already registered")

    updates = user_update.model_dump(exclude_unset=True)
    if "password" in updates and updates["password"] is not None:
        user.password_hash = updates.pop("password")

    for field, value in updates.items():
        setattr(user, field, value)

    await user.save()
    return serialize_user(user)

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    user = await resolve_user(user_id)
    return serialize_user(user)

@router.put("/profile/{user_id}", response_model=UserProfileResponse)
async def update_user_profile(user_id: str, user_update: UserProfileUpdate):
    user = await resolve_user(user_id)
    if user_update.email and user_update.email != user.email:
        existing_user = await User.find_one({"email": user_update.email})
        if existing_user and str(existing_user.id) != str(user.id):
            raise HTTPException(status_code=400, detail="Email already registered")

    updates = user_update.model_dump(exclude_unset=True)
    if "password" in updates and updates["password"] is not None:
        user.password_hash = updates.pop("password")

    for field, value in updates.items():
        setattr(user, field, value)

    await user.save()
    return serialize_user(user)

class PushTokenRequest(PydanticBaseModel):
    user_id: str
    token: str

@router.post("/push-token")
async def register_push_token(req: PushTokenRequest):
    user = await User.find_one({"email": req.user_id})
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

from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    role: str # operator, site_manager, dealer

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str

    class Config:
        from_attributes = True

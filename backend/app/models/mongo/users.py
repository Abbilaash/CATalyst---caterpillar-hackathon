from typing import Optional, List
from datetime import datetime
from pydantic import Field, EmailStr
from beanie import Document, Link

class User(Document):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password_hash: str
    role: str # 'operator', 'site_manager', 'dealer', 'admin'
    status: str = "active"
    expo_push_token: Optional[str] = None  # For Expo push notifications
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"

class Operator(Document):
    user: Link[User]
    license_number: str
    experience_years: int
    assigned_site_id: Optional[str] = None # FK to postgres site_id, keep as string
    status: str = "available"
    certified_equipment_types: List[str] = []
    shift_status: str = "off_duty"
    safety_score: int = 100
    emergency_contact: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "operators"

class SiteManager(Document):
    user: Link[User]
    site_ids: List[str] = [] # List of postgres site_ids
    designation: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "site_managers"

class Dealer(Document):
    user: Link[User]
    company_name: str
    address: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "dealers"

class Notification(Document):
    user_id: str  # Link to mongo user id string
    title: str
    message: str
    notification_type: str  # idle_asset, rental_expiring, rental_overdue, etc.
    severity: str = "medium"  # critical, high, medium, low
    target_role: str = "dealer"  # dealer, manager, operator
    asset_id: Optional[str] = None  # Postgres asset_id for deep-link
    site_id: Optional[str] = None  # Postgres site_id
    action_url: Optional[str] = None  # e.g. /equipment/<id>
    read_status: bool = False
    is_dismissed: bool = False
    push_sent: bool = False  # Was Expo push sent?
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"

class LoginHistory(Document):
    user_id: str
    device: Optional[str] = None
    ip_address: Optional[str] = None
    login_time: datetime = Field(default_factory=datetime.utcnow)
    logout_time: Optional[datetime] = None

    class Settings:
        name = "login_history"

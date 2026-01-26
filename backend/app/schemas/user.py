from typing import Optional
from pydantic import BaseModel #, EmailStr
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    name: Optional[str] = None
    # email: Optional[EmailStr] = None
    email: Optional[str] = None
    role: Optional[str] = "vendedor"
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    # email: EmailStr
    email: str
    password: str
    name: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: UUID
    tenant_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

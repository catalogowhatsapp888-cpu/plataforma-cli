from typing import Optional, Any, Dict
from pydantic import BaseModel
from uuid import UUID

class TenantBase(BaseModel):
    name: Optional[str] = None
    document_id: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class TenantUpdate(TenantBase):
    pass

class Tenant(TenantBase):
    id: UUID
    status: str
    
    class Config:
        from_attributes = True

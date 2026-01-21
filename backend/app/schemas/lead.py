from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# O que vem do "Pipeline" (Status, Temperatura)
class LeadPipelineSchema(BaseModel):
    stage: str
    temperature: str
    score: int
    unread_count: int = 0
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# O objeto completo do Lead para leitura
class ContactSchema(BaseModel):
    id: UUID
    full_name: Optional[str]
    phone_e164: str
    email: Optional[str]
    source: Optional[str]
    lead_pipeline: Optional[LeadPipelineSchema] = None
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

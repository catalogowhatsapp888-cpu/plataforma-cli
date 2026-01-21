from pydantic import BaseModel, Json
from typing import List, Optional, Any, Union, Dict
from datetime import datetime
from uuid import UUID

# --- Blocos de Construção das Regras ---

class AudienceCondition(BaseModel):
    field: str      # Ex: 'temperature', 'last_procedure', 'is_active'
    operator: str   # Ex: 'equals', 'in', 'before', 'after'
    value: Any      # Ex: 'quente', ['toxina'], 'NOW-90DAYS', True

class AudienceRules(BaseModel):
    logic: str = "AND" # AND ou OR
    conditions: List[AudienceCondition] = []

# --- Schemas da Campanha ---

class CampaignBase(BaseModel):
    name: str
    audience_rules: AudienceRules  
    message_template: Optional[str] = None
    media_url: Optional[str] = None
    excluded_contacts: Optional[List[str]] = []
    scheduled_at: Optional[datetime] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    audience_rules: Optional[AudienceRules] = None
    message_template: Optional[str] = None
    media_url: Optional[str] = None
    excluded_contacts: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None

class CampaignSchema(CampaignBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Schemas de Preview e Execução ---

class CampaignPreviewRequest(BaseModel):
    audience_rules: AudienceRules

class ContactSample(BaseModel):
    id: UUID
    full_name: str
    phone: str
    temperature: Optional[str] = None

class CampaignPreviewResponse(BaseModel):
    count: int
    total_leads: int
    sample: List[ContactSample]
    query_time_ms: float

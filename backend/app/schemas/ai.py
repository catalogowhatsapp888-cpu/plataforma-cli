from pydantic import BaseModel
from typing import Optional

class AIConfigBase(BaseModel):
    is_active: bool = False
    system_prompt: str = "Você é uma secretária virtual da clínica. Seu tom é simpático e profissional. Objetivo: Agendar avaliação."
    model_name: str = "gpt-4o"
    whitelist_numbers: list[str] = []

class AIConfigUpdate(BaseModel):
    is_active: Optional[bool] = None
    system_prompt: Optional[str] = None
    model_name: Optional[str] = None
    whitelist_numbers: Optional[list[str]] = None

class AIConfigSchema(AIConfigBase):
    id: int
    
    class Config:
        from_attributes = True

from pydantic import BaseModel

from typing import Optional

class LeadStageUpdate(BaseModel):
    stage: Optional[str] = None
    temperature: Optional[str] = None

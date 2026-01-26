from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import SystemSettings
from pydantic import BaseModel

router = APIRouter()

class CampaignSettings(BaseModel):
    daily_limit: int
    hourly_limit: int
    min_interval_seconds: int
    max_interval_seconds: int
    working_hours_start: str
    working_hours_end: str
    is_active: bool
    
    class Config:
        from_attributes = True

@router.get("/campaign", response_model=CampaignSettings)
def get_campaign_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/campaign", response_model=CampaignSettings)
def update_campaign_settings(payload: CampaignSettings, db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings()
        db.add(settings)
    
    settings.daily_limit = payload.daily_limit
    settings.hourly_limit = payload.hourly_limit
    settings.min_interval_seconds = payload.min_interval_seconds
    settings.max_interval_seconds = payload.max_interval_seconds
    settings.working_hours_start = payload.working_hours_start
    settings.working_hours_end = payload.working_hours_end
    settings.is_active = payload.is_active
    
    db.commit()
    db.refresh(settings)
    return settings

from app.services.evolution_service import evolution_service

class TestMessageRequest(BaseModel):
    phone: str
    message: str

@router.post("/test-message")
def send_test_message(req: TestMessageRequest, db: Session = Depends(get_db)):
    """Envia uma mensagem de teste para verificar a conexão com o WhatsApp."""
    try:
        result = evolution_service.send_message(
            phone=req.phone,
            text=req.message
        )
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

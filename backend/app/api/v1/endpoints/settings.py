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

from app.core.security import verify_password
from app.api import deps
from app.models.models import User

class EvolutionConfig(BaseModel):
    url: str
    apikey: str
    instance: str
    admin_password: str

@router.get("/evolution", response_model=dict)
def get_evolution_config(current_user: User = Depends(deps.get_current_user)):
    # Return current in-memory config
    return {
        "url": evolution_service.base_url,
        "apikey": evolution_service.api_key,
        "instance": evolution_service.instance
    }

@router.put("/evolution")
def update_evolution_config(payload: EvolutionConfig, current_user: User = Depends(deps.get_current_user), db: Session = Depends(get_db)):
    # 1. Verify Password
    if not verify_password(payload.admin_password, current_user.hashed_password):
        raise HTTPException(status_code=403, detail="Senha incorreta.")
    
    # 2. Update Service & Persist
    evolution_service.update_config(payload.url, payload.apikey, payload.instance)
    
    return {"status": "updated", "message": "Configuração da Evolution atualizada com sucesso!"}

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

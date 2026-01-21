from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import AIConfig
from app.schemas.ai import AIConfigSchema, AIConfigUpdate

router = APIRouter()

@router.get("/config", response_model=AIConfigSchema)
def get_ai_config(db: Session = Depends(get_db)):
    config = db.query(AIConfig).first()
    if not config:
        # Auto-create default
        config = AIConfig(id=1, is_active=False)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/config", response_model=AIConfigSchema)
def update_ai_config(update: AIConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(AIConfig).first()
    if not config:
        # Should exist due to auto-migration, but safety check
        config = AIConfig(id=1)
        db.add(config)
    
    if update.is_active is not None: config.is_active = update.is_active
    if update.system_prompt is not None: config.system_prompt = update.system_prompt
    if update.model_name is not None: config.model_name = update.model_name
    if update.whitelist_numbers is not None: config.whitelist_numbers = update.whitelist_numbers
    
    db.commit()
    db.refresh(config)
    return config

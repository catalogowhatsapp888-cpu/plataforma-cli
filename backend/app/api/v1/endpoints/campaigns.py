from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.campaign import CampaignPreviewRequest, CampaignPreviewResponse, CampaignCreate, CampaignSchema, ContactSample, CampaignUpdate
from app.services.campaign_service import campaign_service
from app.models.models import Campaign, Contact, CampaignEvent, LeadPipeline
from sqlalchemy import func
import time
import uuid

router = APIRouter()

@router.post("/preview", response_model=CampaignPreviewResponse)
def preview_audience(request: CampaignPreviewRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    
    # 1. Constrói Query Dinâmica
    query = campaign_service.build_query(db, request.audience_rules)
    
    # 2. Executa Contagem (Rápida)
    total_matches = query.count()
    
    # 3. Busca Total Real (para comparação)
    total_leads = db.query(Contact).count()
    
    # 4. Busca Amostra (Top 500 para seleção)
    sample_objs = query.limit(500).all()
    
    # 5. Formata Amostra
    sample_data = []
    for c in sample_objs:
        temp = c.lead_pipeline.temperature if c.lead_pipeline else None
        sample_data.append(ContactSample(
            id=c.id,
            full_name=c.full_name or "Sem Nome",
            phone=c.phone_e164,
            temperature=temp
        ))

    elapsed = (time.time() - start_time) * 1000
    
    return {
        "count": total_matches,
        "total_leads": total_leads,
        "sample": sample_data,
        "query_time_ms": elapsed
    }

@router.post("/", response_model=CampaignSchema)
def create_campaign(campaign_in: CampaignCreate, db: Session = Depends(get_db)):
    # Serializa regras para o banco (Pydantic -> Dict -> JSON Column)
    rules_dump = campaign_in.audience_rules.model_dump()
    
    new_campaign = Campaign(
        name=campaign_in.name,
        audience_rules=rules_dump,
        message_template=campaign_in.message_template,
        media_url=campaign_in.media_url,
        excluded_contacts=campaign_in.excluded_contacts,
        scheduled_at=campaign_in.scheduled_at,
        status='draft'
    )
    
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign

@router.get("/", response_model=list[CampaignSchema])
def list_campaigns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()
    return campaigns

@router.post("/{campaign_id}/execute")
def execute_campaign_endpoint(campaign_id: str, force: bool = False, db: Session = Depends(get_db)):
    try:
        result = campaign_service.execute_campaign(db, campaign_id, force_resend=force)
        if "error" in result:
             raise HTTPException(status_code=400, detail=result["error"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{campaign_id}", response_model=CampaignSchema)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    try:
        cid = uuid.UUID(str(campaign_id))
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    camp = db.query(Campaign).filter(Campaign.id == cid).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return camp

@router.put("/{campaign_id}", response_model=CampaignSchema)
def update_campaign(campaign_id: str, update: CampaignUpdate, db: Session = Depends(get_db)):
    try:
        cid = uuid.UUID(str(campaign_id))
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
        
    camp = db.query(Campaign).filter(Campaign.id == cid).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
        
    if update.name is not None: camp.name = update.name
    if update.message_template is not None: camp.message_template = update.message_template
    if update.media_url is not None: camp.media_url = update.media_url
    if update.excluded_contacts is not None: camp.excluded_contacts = update.excluded_contacts
    if update.scheduled_at is not None: camp.scheduled_at = update.scheduled_at
    if update.audience_rules is not None:
        camp.audience_rules = update.audience_rules.model_dump()
        
    db.commit()
    db.refresh(camp)
    return camp

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: str, db: Session = Depends(get_db)):
    try:
        cid = uuid.UUID(str(campaign_id))
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
        
    camp = db.query(Campaign).filter(Campaign.id == cid).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
        
    db.delete(camp)
    db.commit()
    return {"status": "deleted"}

@router.get("/{campaign_id}/stats")
def get_campaign_stats(campaign_id: str, db: Session = Depends(get_db)):
    try:
        cid = uuid.UUID(str(campaign_id))
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
        
    camp = db.query(Campaign).filter(Campaign.id == cid).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
        
    total_events = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == cid).count()
    sent = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == cid, CampaignEvent.status == 'sent').count()
    failed = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == cid, CampaignEvent.status == 'failed').count()
    
    return {
        "status": camp.status,
        "total": total_events,
        "sent": sent,
        "failed": failed,
        "processed": sent + failed,
        "pending": total_events - (sent + failed)
    }

@router.get("/{campaign_id}/leads")
def get_campaign_leads(campaign_id: str, db: Session = Depends(get_db)):
    try:
        cid = uuid.UUID(str(campaign_id))
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
        
    events = db.query(CampaignEvent, Contact, LeadPipeline).\
        join(Contact, CampaignEvent.contact_id == Contact.id).\
        outerjoin(LeadPipeline, Contact.id == LeadPipeline.contact_id).\
        filter(CampaignEvent.campaign_id == cid).all()
    
    results = []
    for event, contact, pipeline in events:
        results.append({
            "contact_id": str(contact.id),
            "full_name": contact.full_name,
            "phone": contact.phone_e164,
            "status": event.status,
            "replied": event.replied_at is not None,
            "replied_at": event.replied_at,
            "temperature": pipeline.temperature if pipeline else None,
            "stage": pipeline.stage if pipeline else None
        })
        
    return results

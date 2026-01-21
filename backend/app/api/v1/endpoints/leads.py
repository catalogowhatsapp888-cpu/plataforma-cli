from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from uuid import UUID
from pydantic import BaseModel
from app.db.session import get_db
from sqlalchemy.sql import func, text
from app.models.models import Contact, LeadPipeline, Conversation, Message
from app.schemas.lead import ContactSchema
from app.services.import_service import process_excel_import
import os

router = APIRouter()

@router.get("/", response_model=List[ContactSchema])
def list_leads(
    skip: int = 0, 
    limit: int = 100, 
    stage: str = None, 
    db: Session = Depends(get_db)
):
    """
    Lista todos os leads paginados.
    Opcional: Filtrar por estágio (ex: ?stage=novo)
    """
    query = db.query(Contact).join(LeadPipeline)
    
    if stage:
        query = query.filter(LeadPipeline.stage == stage)
        
    query = query.order_by(Contact.created_at.desc())
    leads = query.offset(skip).limit(limit).all()
    return leads

@router.get("/dashboard/stats")
def get_stats(db: Session = Depends(get_db)):
    """
    Retorna números totais para o Dashboard.
    """
    total = db.query(Contact).count()
    novos = db.query(Contact).join(LeadPipeline).filter(LeadPipeline.stage == 'novo').count()
    quentes = db.query(Contact).join(LeadPipeline).filter(LeadPipeline.temperature == 'quente').count()
    
    return {
        "total_leads": total,
        "novos": novos,
        "quentes": quentes
    }

from app.schemas.lead_update import LeadStageUpdate
from uuid import UUID

@router.put("/{lead_id}/stage")
def update_lead_stage(lead_id: UUID, update: LeadStageUpdate, db: Session = Depends(get_db)):
    """
    Atualiza o estágio do lead no pipeline.
    """
    pipeline = db.query(LeadPipeline).filter(LeadPipeline.contact_id == lead_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Lead pipeline not found")
    
    if update.stage:
        pipeline.stage = update.stage
    
    if update.temperature:
        pipeline.temperature = update.temperature
    
    db.commit()
    db.refresh(pipeline)
    return {"status": "success", "new_stage": pipeline.stage}

from app.schemas.message import SendMessageRequest
from app.services.evolution_service import evolution_service

@router.post("/{lead_id}/message")
def send_lead_message(lead_id: UUID, request: SendMessageRequest, db: Session = Depends(get_db)):
    """
    Envia uma mensagem de WhatsApp para o lead.
    """
    contact = db.query(Contact).filter(Contact.id == lead_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    result = evolution_service.send_message(
        phone=contact.phone_e164,
        text=request.message,
        media_url=request.media_url
    )
    
    # 1. Busca ou cria conversa aberta
    # Também atualiza Stage se necessário
    pipeline = db.query(LeadPipeline).filter(LeadPipeline.contact_id == lead_id).first()
    if pipeline and pipeline.stage in ['novo', 'nao_lido']:
        pipeline.stage = 'contactado'
        # Zera unread também por garantia
        pipeline.unread_count = 0 
        db.add(pipeline) # Marca para commit
    
    conversation = db.query(Conversation).filter(
        Conversation.contact_id == lead_id, 
        Conversation.status == 'open'
    ).first()
    
    if not conversation:
        conversation = Conversation(contact_id=lead_id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # 2. Registra mensagem
    new_msg = Message(
        conversation_id=conversation.id,
        direction='outbound',
        content=request.message,
        content_type='image' if request.media_url else 'text',
        status='sent'
    )
    db.add(new_msg)
    contact.last_interaction_at = func.now()
    db.commit()

    return result

@router.get("/{lead_id}/history")
def get_lead_history(lead_id: UUID, db: Session = Depends(get_db)):
    """
    Retorna o histórico unificado (Evolution API + Banco Local).
    Prioriza Evolution API para ter o real-time do WhatsApp.
    Remove duplicatas baseando-se em Conteúdo + Timestamp (Minuto).
    """
    contact = db.query(Contact).filter(Contact.id == lead_id).first()
    if not contact:
        return []

    # Zera contador de não lidos
    pipeline = db.query(LeadPipeline).filter(LeadPipeline.contact_id == lead_id).first()
    if pipeline and pipeline.unread_count > 0:
        pipeline.unread_count = 0
        db.commit()

    from datetime import datetime
    
    evo_messages = evolution_service.fetch_history(contact.phone_e164)
    formatted_history = []

    # 1. Processa Evolution (Fonte Primária)
    seen_evo_ids = set()
    
    if evo_messages:
        for msg in evo_messages:
            if not isinstance(msg, dict): continue

            key = msg.get('key', {})
            msg_id = key.get('id')
            
            # Deduplicação por ID da mensagem
            if msg_id and msg_id in seen_evo_ids:
                continue
            if msg_id:
                seen_evo_ids.add(msg_id)

            content = msg.get('message', {})
            if not content: continue 

            direction = 'outbound' if key.get('fromMe') else 'inbound'
            
            # Extração de conteúdo
            text_content = ""
            msg_type = "text"
            
            if 'conversation' in content: text_content = content['conversation']
            elif 'extendedTextMessage' in content: text_content = content['extendedTextMessage'].get('text', '')
            elif 'imageMessage' in content:
                text_content = content['imageMessage'].get('caption', '<Imagem>')
                msg_type = "image"
            elif 'audioMessage' in content: text_content = "<Áudio>"; msg_type = "audio"
            elif 'videoMessage' in content: text_content = "<Vídeo>"; msg_type = "video"
            elif 'documentMessage' in content: text_content = "<Documento>"; msg_type = "document"
            elif 'stickerMessage' in content: text_content = "<Figurinha>"; msg_type = "sticker"
            else:
                 for k, v in content.items():
                    if 'Message' in k and isinstance(v, dict):
                         if 'caption' in v: text_content = v['caption']
                         elif 'text' in v: text_content = v['text']
            
            if not text_content: text_content = "[Mídia/Outro]"

            ts = msg.get('messageTimestamp')
            timestamp_iso = ""
            
            if ts:
                ts_int = int(ts)
                dt = datetime.fromtimestamp(ts_int)
                timestamp_iso = dt.isoformat()

            formatted_history.append({
                "id": key.get('id', 'evo-'+str(uuid.uuid4())),
                "direction": direction,
                "content": text_content,
                "content_type": msg_type,
                "timestamp": timestamp_iso,
                "source": "evolution"
            })

    # CRÍTICO: Se temos histórico da Evolution, retornamos APENAS ele para evitar duplicação.
    if formatted_history:
        formatted_history.sort(key=lambda x: x['timestamp'] or "")
        return formatted_history

    # 2. Fallback: Processa Banco Local APENAS se Evolution não retornou nada validável
    local_history = db.query(Message).join(Conversation).filter(Conversation.contact_id == lead_id).all()
    
    for l_msg in local_history:
        ts_local_iso = ""
        if l_msg.timestamp:
            ts_local_iso = l_msg.timestamp.isoformat()

        formatted_history.append({
            "id": str(l_msg.id),
            "direction": l_msg.direction,
            "content": l_msg.content,
            "content_type": l_msg.content_type,
            "timestamp": ts_local_iso,
            "source": "local"
        })

    formatted_history.sort(key=lambda x: x['timestamp'] or "")
    
    return formatted_history

# Endpoint para Atualizar Lead (Editar)
class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

@router.put("/{lead_id}")
def update_lead(lead_id: UUID, lead_data: LeadUpdate, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == lead_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_data.full_name:
        contact.full_name = lead_data.full_name
    if lead_data.email:
        contact.email = lead_data.email
    if lead_data.phone:
        contact.phone_e164 = lead_data.phone
        
    db.commit()
    db.refresh(contact)
    return contact

# Endpoint para Criar Novo Lead (Inclusão)
class LeadCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None

def clean_phone(phone: str) -> str:
    import re
    digits = re.sub(r'\D', '', phone)
    # Se não tiver dígitos suficientes, retorna o original (vai falhar ou salvar sujo)
    if len(digits) < 8:
        return phone
        
    # Assume Brasil (+55) se não começar com 55 e tiver 10 ou 11 dígitos
    if len(digits) in [10, 11]:
        digits = '55' + digits
        
    return f"+{digits}"

@router.post("/", response_model=ContactSchema)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    # Limpa telefone
    phone_clean = clean_phone(lead.phone)

    # Verifica duplicidade
    existing = db.query(Contact).filter(Contact.phone_e164 == phone_clean).first()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Já existe um lead com este telefone: {existing.full_name} ({phone_clean})"
        )

    # Trata email vazio
    email_val = lead.email if lead.email and lead.email.strip() else None

    new_contact = Contact(
        full_name=lead.full_name,
        phone_e164=phone_clean,
        email=email_val,
        source="manual",
        type="lead"
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    
    # Cria Pipeline
    pipeline = LeadPipeline(contact_id=new_contact.id, stage="novo", temperature="frio")
    db.add(pipeline)
    db.commit()
    
    return new_contact

    return new_contact


@router.post("/sync")
def sync_leads_from_file(db: Session = Depends(get_db)):
    """Sincroniza leads a partir do arquivo padrão Leads_clinica.xlsx"""
    current_file = os.path.dirname(__file__)
    # Sobe 5 níveis para chegar à raiz do projeto a partir de .../endpoints/leads.py
    project_root = os.path.abspath(os.path.join(current_file, '../../../../..'))
    
    # Prioridade 1: planilhas leads/Leads_clinica.xlsx
    target_file = os.path.join(project_root, 'planilhas leads', 'Leads_clinica.xlsx')
    
    if not os.path.exists(target_file):
        # Prioridade 2: dados_entrada/[qqer .xlsx]
        fallback_dir = os.path.join(project_root, 'dados_entrada')
        if os.path.exists(fallback_dir):
            files = [f for f in os.listdir(fallback_dir) if f.endswith('.xlsx')]
            if files:
                target_file = os.path.join(fallback_dir, files[0])
            else:
                 raise HTTPException(status_code=404, detail="Nenhum arquivo .xlsx encontrado para sincronização (planilhas leads ou dados_entrada).")
        else:
             raise HTTPException(status_code=404, detail="Pasta de planilhas não encontrada.")

    result = process_excel_import(db, target_file)
    return result


@router.delete("/reset_all")
def reset_all_leads(db: Session = Depends(get_db)):
    """LIMPEZA TOTAL: Apaga contatos, pipelines e mensagens."""
    try:
        db.execute(text("DELETE FROM campaign_events"))
        # As mensagens dependem das conversas, deletar mensagens primeiro (ou cascade)
        db.execute(text("DELETE FROM messages"))
        db.execute(text("DELETE FROM conversations"))
        # Nome da tabela correto: leads_pipeline
        db.execute(text("DELETE FROM leads_pipeline"))
        # Faltava deletar procedimentos que dependem de contacts
        db.execute(text("DELETE FROM procedures"))
        
        db.execute(text("DELETE FROM contacts"))
        db.commit()
        return {"success": True, "message": "Banco de dados limpo."}
    except Exception as e:
        db.rollback()
        print(f"Erro no Reset DB: {e}")
        # Retorna erro 500 com detalhe
        raise HTTPException(status_code=500, detail=f"Erro SQL: {str(e)}")

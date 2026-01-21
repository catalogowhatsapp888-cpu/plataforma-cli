from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Contact, Conversation, Message, LeadPipeline, AIConfig, Campaign, CampaignEvent
from app.services.ai_service import ai_service
from app.services.evolution_service import evolution_service
from sqlalchemy.sql import func
import logging
import json

router = APIRouter()

# Configuração básica de log para o módulo
logger = logging.getLogger(__name__)

@router.post("/")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes)
        
        # 1. Identificar Evento (Flexível: aceita 'type' ou 'event', Upper ou Lower)
        event = payload.get('type') or payload.get('event')
        
        # Se não for MESSAGES_UPSERT, loga warning mas tenta processar sem bloquear rigidamente
        if not event or 'MESSAGES_UPSERT' not in event.upper():
            pass 

        # 2. Extrair Dados Principais
        data = payload.get('data', {})
        key = data.get('key', {})
        content_obj = data.get('message', {})

        if not content_obj:
            return {"status": "ignored_no_content"}

        remote_jid = key.get('remoteJid', '')
        from_me = key.get('fromMe', False)
        push_name = data.get('pushName', 'Desconhecido')
        msg_id = key.get('id')

        # 3. Tratamento de Telefone (Estratégia Robusta com/sem 9º dígito)
        phone_raw = remote_jid.split('@')[0]
        
        candidates = [phone_raw, f"+{phone_raw}"]
        if phone_raw.startswith("55") or phone_raw.startswith("+55"):
            clean_p = phone_raw.replace('+', '')
            ddd = clean_p[2:4]
            rest = clean_p[4:]
            
            if len(rest) == 8: # Sem 9 -> Adiciona 9 para testar
                p_new = f"55{ddd}9{rest}"
                candidates.extend([p_new, f"+{p_new}"])
            elif len(rest) == 9 and rest.startswith('9'): # Com 9 -> Remove 9 para testar
                p_new = f"55{ddd}{rest[1:]}"
                candidates.extend([p_new, f"+{p_new}"])

        # Busca contato no BD
        contact = None
        for p in candidates:
            contact = db.query(Contact).filter(Contact.phone_e164 == p).first()
            if contact:
                break
        
        # 4. Auto-Create Contact (Se não achar, cria na hora para garantir persistência)
        if not contact:
            print(f"👤 Novo Contato Detectado: {push_name} ({phone_raw})")
            new_phone = f"+{phone_raw}" if not phone_raw.startswith('+') else phone_raw
            contact = Contact(
                full_name=push_name,
                phone_e164=new_phone,
                type='lead',
                source='whatsapp_inbound'
            )
            db.add(contact)
            db.commit()
            db.refresh(contact)

        # 5. Garantir Conversa Aberta
        conversation = db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.status == 'open'
        ).first()

        if not conversation:
            conversation = Conversation(contact_id=contact.id)
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 6. Processar Conteúdo da Mensagem
        text_content = ""
        msg_type = "text"
        
        if 'conversation' in content_obj:
            text_content = content_obj['conversation']
        elif 'extendedTextMessage' in content_obj:
            text_content = content_obj['extendedTextMessage'].get('text', '')
        elif 'imageMessage' in content_obj:
            text_content = content_obj['imageMessage'].get('caption', '<Imagem>')
            msg_type = "image"
        elif 'audioMessage' in content_obj:
            text_content = "<Áudio>"
            msg_type = "audio"
        else:
            # Fallback para debug
            text_content = f"[{list(content_obj.keys())[0]}]"
            msg_type = "media"

        # 7. Evitar Duplicidade de ID
        existing = db.query(Message).filter(Message.external_id == msg_id).first()
        # ATUALIZAÇÃO INTELIGENTE DE PIPELINE
        # Buscar ou criar pipeline se não existir
        pipeline = db.query(LeadPipeline).filter(LeadPipeline.contact_id == contact.id).first()
        if not pipeline:
            pipeline = LeadPipeline(contact_id=contact.id, stage="novo", temperature="frio")
            db.add(pipeline)
        
        if not from_me: # Inbound (Cliente mandou)
            # --- COMANDO DE RESET PARA TESTES ---
            if text_content and text_content.strip().lower() == '/reset':
                print(f"🧹 RESET RECEBIDO DE {contact.full_name}. Limpando histórico...")
                db.query(Message).filter(Message.contact_id == contact.id).delete()
                pipeline.stage = 'novo'
                pipeline.temperature = 'frio'
                pipeline.unread_count = 0
                db.commit()
                db.refresh(pipeline)
                return {"status": "reset_performed"}
            # ------------------------------------

            # Atualiza stage se for Novo, pois já houve interação
            if pipeline.stage == 'novo' or pipeline.stage is None:
                print(f"🚀 DEBUG: Movendo Lead {contact.full_name} de NOVO -> CONTACTADO")
                pipeline.stage = 'contactado'
                db.commit()
                db.refresh(pipeline) # CRÍTICO: Recarregar objeto após commit parcial
            
            # NÃO mover para 'nao_lido' forçadamente. Manter no estágio atual.
            # Apenas incrementar contador.
            pipeline.unread_count = (pipeline.unread_count or 0) + 1

            # --- CAMPAIGN TRACKING ---
            try:
                from datetime import datetime, timedelta
                # Busca evento de campanha recente (ultimas 72h) que ainda não foi respondido
                # Assim sabemos que esta mensagem é uma REAÇÃO à campanha
                limit_date = datetime.now() - timedelta(hours=72)
                
                recent_event = db.query(CampaignEvent).filter(
                    CampaignEvent.contact_id == contact.id,
                    CampaignEvent.status == 'sent',
                    CampaignEvent.replied_at == None,
                    CampaignEvent.processed_at >= limit_date
                ).order_by(CampaignEvent.processed_at.desc()).first()
                
                if recent_event:
                    recent_event.replied_at = func.now()
                    print(f"🎯 Resposta vinculada à campanha: {recent_event.campaign_id}")
            except Exception as e:
                print(f"⚠️ Erro ao rastrear campanha: {e}")
            # -------------------------
        else: # Outbound (Eu mandei)
            pipeline.unread_count = 0
            # Se eu respondi, e ele estava em Novo ou Não Lido -> Move para Contactado
            if pipeline.stage in ['novo', 'nao_lido']:
                pipeline.stage = 'contactado'
                print(f"🔄 Lead {contact.full_name} movido para CONTACTADO (Resposta Enviada)")

        # 8. Salvar Mensagem
        new_msg = Message(
            conversation_id=conversation.id,
            external_id=msg_id,
            direction='outbound' if from_me else 'inbound',
            content=text_content,
            content_type=msg_type,
            status='received',
            timestamp=func.now()
        )
        db.add(new_msg)
        contact.last_interaction_at = func.now()
        db.commit()
        
        print(f"✅ Recebido: {contact.full_name} diz: {text_content[:30]}...")
        
        # 9. IA AUTOMATION
        # Executar lógica de BOT se habilitado
        ai_config = db.query(AIConfig).first()
        should_reply = False
        
        print(f"🔍 DEBUG: Pipeline Stage={pipeline.stage} Temp={pipeline.temperature} Unread={pipeline.unread_count}")
        
        if ai_config and ai_config.is_active:
            # 1. Whitelist Check (Prioridade Máxima para Testes)
            whitelist = ai_config.whitelist_numbers or []
            # Normalização simples para comparação (remove +)
            c_clean = contact.phone_e164.replace('+', '')
            w_clean = [str(x).replace('+', '').strip() for x in whitelist]
            
            is_whitelisted = c_clean in w_clean
            
            # Debug Fail
            if not is_whitelisted:
                 print(f"🔍 DEBUG: Whitelist falhou. Clean={c_clean} List={w_clean}")

            # CORREÇÃO CRÍTICA: Só responde se mensagem vier do CLIENTE (not from_me)
            if is_whitelisted and not from_me:
                # Respeitar parada se já foi finalizado (agendado/perdido), mesmo na whitelist
                if pipeline.stage in ['agendado', 'perdido']:
                    print(f"🛡️ Whitelist: Lead finalizado ({pipeline.stage}). IA Pausada.")
                    should_reply = False
                else:
                    print(f"🛡️ Whitelist MATCH: Respondendo {contact.full_name} (Modo Teste)")
                    should_reply = True
            
            # 2. Regra Padrão (SÓ QUENTES na Homologação)
            elif pipeline.temperature == 'quente' and (pipeline.unread_count or 0) > 0:
                if pipeline.stage not in ['agendado', 'perdido']:
                    should_reply = True
                
        if should_reply:
            print(f"🤖 Acionando IA para {contact.full_name}...")
            # Carregar histórico (últimas 10 mensagens)
            history_objs = db.query(Message).filter(
                Message.conversation_id == conversation.id
            ).order_by(Message.timestamp.desc()).limit(15).all()
            
            history = []
            for m in reversed(history_objs): # Reverte para ordem cronológica (antiga -> nova)
                role = "user" if m.direction == 'inbound' else "assistant"
                content = m.content or ""
                # Ignorar mensagens de sistema/mídia complexa na entrada do prompt por enquanto
                if content:
                    history.append({"role": role, "content": content})
            
            # Gerar Resposta
            # Injetar contexto de nome atual
            current_prompt = f"{ai_config.system_prompt}\n\nDADO DO SISTEMA: O nome atual deste contato é '{contact.full_name}'."
            
            response_text = ai_service.generate_response(
                history=history, 
                system_prompt=current_prompt,
                db=db,
                contact_id=contact.id
            )
            
            if response_text:
                # Enviar via WhatsApp
                evolution_service.send_message(contact.phone_e164, response_text)
                
                # Salvar no Banco
                ai_msg = Message(
                    conversation_id=conversation.id,
                    external_id=f"ai-{func.now()}", # Fake ID
                    direction='outbound',
                    content=response_text,
                    content_type='text',
                    status='sent',
                    timestamp=func.now()
                )
                db.add(ai_msg)
                
                # Opcional: Marcar como lido ou manter nao_lido? 
                # Se bot respondeu, tecnicamente foi "atendido", mas talvez manter alerta.
                # Vou manter stage como está.
                
                db.commit()
                print(f"🤖 Resposta IA enviada: {response_text[:30]}...")

        return {"status": "saved", "id": msg_id}

    except Exception as e:
        print(f"❌ Erro Webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "reason": str(e)}

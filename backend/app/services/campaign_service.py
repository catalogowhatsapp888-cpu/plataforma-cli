from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, not_, func
from app.models.models import Contact, LeadPipeline, Procedure, Campaign, CampaignEvent, SystemSettings
from app.schemas.campaign import AudienceRules, AudienceCondition
from app.services.evolution_service import evolution_service
from datetime import datetime, timedelta
import logging
import uuid
import random

class CampaignService:
    def execute_campaign(self, db: Session, campaign_id: str, force_resend: bool = False):
        try:
            cid = uuid.UUID(str(campaign_id))
        except ValueError:
            return {"error": "ID de campanha inválido formato UUID"}

        # 1. Carrega Campanha
        campaign = db.query(Campaign).filter(Campaign.id == cid).first()
        if not campaign:
            raise ValueError("Campanha não encontrada")

        if not campaign.audience_rules:
            return {"error": "Campanha sem regras definidas"}

        # 2. Resovle Audiência
        rules_data = campaign.audience_rules
        if isinstance(rules_data, str):
            import json
            rules_data = json.loads(rules_data)
            
        rules_schema = AudienceRules(**rules_data)
        query = self.build_query(db, rules_schema)
        leads = query.all()

        # Filtro de Exclusão Manual
        if campaign.excluded_contacts:
            exclusions = campaign.excluded_contacts if isinstance(campaign.excluded_contacts, list) else []
            if isinstance(exclusions, str):
                import json
                try: exclusions = json.loads(exclusions)
                except: exclusions = []
            excluded_set = set(str(x) for x in exclusions)
            leads = [l for l in leads if str(l.id) not in excluded_set]

        queued_count = 0
        skipped_count = 0
        
        logging.info(f"Enfileirando Campanha '{campaign.name}' com {len(leads)} leads.")

        # 3. Enfileirar (Não envia agora)
        for lead in leads:
            # Check se já existe evento para este lead nesta campanha
            exists = db.query(CampaignEvent).filter(
                CampaignEvent.campaign_id == campaign.id,
                CampaignEvent.contact_id == lead.id
            ).first()
            
            should_queue = False
            
            if not exists:
                should_queue = True
            elif force_resend:
                # Se for resend, podemos resetar o status para queued se foi erro ou sucesso anterior?
                # Cuidado para não duplicar se já houver registro. Vamos atualizar.
                exists.status = 'queued'
                exists.sent_at = None
                exists.processed_at = datetime.now()
                queued_count += 1
                should_queue = False # Já tratado
            
            if exists and not force_resend:
                skipped_count += 1
                continue

            if should_queue:
                event = CampaignEvent(
                    id=uuid.uuid4(),
                    campaign_id=campaign.id,
                    contact_id=lead.id,
                    status="queued",
                    processed_at=datetime.now() # Data de enfileiramento
                )
                db.add(event)
                queued_count += 1
        
        # Ativa campanha para o worker pegar
        campaign.status = 'active'
        campaign.last_run_at = datetime.now()
        
        db.commit()
        
        return {
            "campaign": campaign.name,
            "total_audience": len(leads),
            "queued_now": queued_count,
            "skipped": skipped_count,
            "message": "Campanha iniciada. As mensagens serão enviadas em segundo plano respeitando os limites."
        }

    def process_queue(self, db: Session):
        """
        Processa UM item da fila se as regras permitirem.
        Deve ser chamado em loop ou cron frequente.
        """
        settings = db.query(SystemSettings).first()
        if not settings:
            # Cria default se não existir
            settings = SystemSettings()
            db.add(settings)
            db.commit()
            
        if not settings.is_active:
            # logging.info("Disparos globais pausados.")
            return

        now = datetime.now()

        # 1. Horário Comercial
        try:
            current_hm = now.strftime("%H:%M")
            if not (settings.working_hours_start <= current_hm <= settings.working_hours_end):
                return # Fora do horário
        except:
            pass # Ignora erro de parse e segue (fail open ou close? open para testes)

        # 2. Limites
        # Contar envios HOJE
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        sent_today = db.query(func.count(CampaignEvent.id)).filter(
            CampaignEvent.status == 'sent',
            CampaignEvent.sent_at >= start_of_day
        ).scalar()
        
        if sent_today >= settings.daily_limit:
            return

        # Contar envios NA ÚLTIMA HORA
        one_hour_ago = now - timedelta(hours=1)
        sent_last_hour = db.query(func.count(CampaignEvent.id)).filter(
            CampaignEvent.status == 'sent',
            CampaignEvent.sent_at >= one_hour_ago
        ).scalar()

        if sent_last_hour >= settings.hourly_limit:
            return

        # 3. Intervalo Aleatório
        # Pega o ÚLTIMO envio feito
        last_sent = db.query(CampaignEvent).filter(CampaignEvent.status == 'sent').order_by(CampaignEvent.sent_at.desc()).first()
        
        if last_sent and last_sent.sent_at:
            delta = (now - last_sent.sent_at).total_seconds()
            
            # Intervalo dinâmico com aleatoriedade (Stateless Check)
            # Sorteia um target entre Min e Max a cada check
            target_wait = random.uniform(settings.min_interval_seconds, settings.max_interval_seconds)
            
            if delta < target_wait:
                # logging.info(f"Aguardando intervalo seguro (Delta: {delta:.1f}s / Target: {target_wait:.1f}s)")
                return

        # 4. Pegar Próximo da Fila
        # Prioridade: First In First Out
        pending = db.query(CampaignEvent).join(Campaign).filter(
            CampaignEvent.status == 'queued',
            Campaign.status == 'active'
        ).order_by(CampaignEvent.processed_at.asc()).first()
        
        if not pending:
            return

        # 5. DISPARAR
        try:
            lead = pending.contact
            campaign = pending.campaign
            
            # Validação telefone
            if not lead.phone_e164:
                pending.status = 'failed'
                db.commit()
                return

            # Calcular Delay de Digitação (Typing Simulation)
            full_text = campaign.message_template or ""
            # Regra: ~60ms por caractere
            typing_ms = len(full_text) * 60 
            if typing_ms < 2000: typing_ms = 2000 # Min 2s digitando
            if typing_ms > 15000: typing_ms = 15000 # Max 15s digitando
            
            # Jitter aleatório no typing (+- 20%)
            jitter = random.uniform(0.8, 1.2)
            typing_ms = int(typing_ms * jitter)

            logging.info(f"🚀 [DISPARO SEGURO] {lead.full_name} (Typing: {typing_ms}ms)")
            
            if campaign.message_template or campaign.media_url:
                evolution_service.send_message(
                    phone=lead.phone_e164,
                    text=campaign.message_template,
                    media_url=campaign.media_url,
                    delay=typing_ms
                )
            
            pending.status = 'sent'
            pending.sent_at = datetime.now()
            
            # Atualizar Pipeline (Movimentação do Card)
            pipeline_entry = db.query(LeadPipeline).filter(LeadPipeline.contact_id == lead.id).first()
            if pipeline_entry:
                if pipeline_entry.stage == 'novo':
                    pipeline_entry.stage = 'contactado'
                    logging.info(f"🔄 Movendo lead {lead.full_name} de 'novo' para 'contactado'")

            db.commit()
            
        except Exception as e:
            logging.error(f"❌ Falha envio fila: {e}")
            # Se quiser retry, mudar processed_at pra futuro?
            # Por enquanto, fail hard.
            pending.status = 'failed'
            db.commit()

    def resolve_date_value(self, value: str) -> datetime:
        if not isinstance(value, str) or not value.startswith("NOW"):
            try: return datetime.fromisoformat(value)
            except: return value
        base = datetime.now()
        parts = value.split('-')
        if len(parts) < 2: return base
        modifier = parts[1]
        if 'DAYS' in modifier:
            days = int(modifier.replace('DAYS', ''))
            return base - timedelta(days=days)
        return base

    def build_query(self, db: Session, rules: AudienceRules):
        base_query = db.query(Contact).join(LeadPipeline)
        filters = []
        for rule in rules.conditions:
            f_expr = self._parse_condition(rule)
            if f_expr is not None: filters.append(f_expr)
        if not filters: return base_query 
        if rules.logic == 'OR': return base_query.filter(or_(*filters))
        else: return base_query.filter(and_(*filters))

    def _parse_condition(self, rule: AudienceCondition):
        field = rule.field
        op = rule.operator
        val = rule.value
        column = None
        
        if field == 'temperature': column = LeadPipeline.temperature
        elif field == 'stage': column = LeadPipeline.stage
        elif field == 'is_active': column = Contact.is_active
        elif field == 'source': column = Contact.source
        elif field == 'unread_count': column = LeadPipeline.unread_count
        elif field == 'full_name': column = Contact.full_name
        elif field == 'id': column = Contact.id
        else: return None

        if 'date' in field or op in ['before', 'after']:
            val = self.resolve_date_value(val)

        if op == 'equals': return column == val
        elif op == 'not_equals': return column != val
        elif op == 'in':
            if not isinstance(val, list): val = [val]
            if field == 'id':
                try: val = [uuid.UUID(str(v)) for v in val]
                except: pass
            return column.in_(val)
        elif op == 'contains': return column.ilike(f"%{val}%")
        elif op == 'greater_than' or op == 'after': return column > val
        elif op == 'less_than' or op == 'before': return column < val
        elif op == 'is_true': return column == True
        elif op == 'is_false': return column == False
        return None

campaign_service = CampaignService()

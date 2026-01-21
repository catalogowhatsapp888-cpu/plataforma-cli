import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, DECIMAL, ARRAY, Date, Uuid, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255))
    phone_e164 = Column(String(20), unique=True, nullable=False)
    email = Column(String(255))
    cpf = Column(String(14))
    source = Column(String(50))  # 'sheets', 'indication', 'ads'
    type = Column(String(20), default='lead')  # 'lead', 'patient'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_interaction_at = Column(DateTime(timezone=True))
    opt_in = Column(Boolean, default=False)
    
    # Novo campo para campanha
    is_active = Column(Boolean, default=True)

    # Relationships
    lead_pipeline = relationship("LeadPipeline", back_populates="contact", uselist=False)
    conversations = relationship("Conversation", back_populates="contact")
    procedures = relationship("Procedure", back_populates="contact")


class LeadPipeline(Base):
    __tablename__ = "leads_pipeline"

    contact_id = Column(Uuid(as_uuid=True), ForeignKey("contacts.id"), primary_key=True)
    stage = Column(String(50), nullable=False, default='novo')
    temperature = Column(String(20), default='frio')
    score = Column(Integer, default=0)
    assigned_to = Column(Uuid(as_uuid=True), nullable=True) # Assuming User table exists later
    unread_count = Column(Integer, default=0)
    notes = Column(Text)

    contact = relationship("Contact", back_populates="lead_pipeline")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(Uuid(as_uuid=True), ForeignKey("contacts.id"))
    status = Column(String(20), default='open')
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True))

    contact = relationship("Contact", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(Uuid(as_uuid=True), ForeignKey("conversations.id"))
    external_id = Column(String(100))
    direction = Column(String(10), nullable=False) # 'inbound', 'outbound'
    content = Column(Text)
    content_type = Column(String(20), default='text')
    status = Column(String(20), default='queued')
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(Uuid(as_uuid=True), ForeignKey("contacts.id"))
    external_id = Column(String(100))
    procedure_name = Column(String(255), nullable=False)
    category = Column(String(100))
    performed_at = Column(Date, nullable=False)
    value = Column(DECIMAL(10, 2))
    next_maintenance_date = Column(Date)

    contact = relationship("Contact", back_populates="procedures")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    status = Column(String(20), default='draft') # draft, active, completed
    audience_rules = Column(JSON, nullable=True) # Armazena o JSON das regras
    message_template = Column(Text, nullable=True)
    media_url = Column(String(500), nullable=True)
    excluded_contacts = Column(JSON, nullable=True, default=[]) # Lista de IDs excluídos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scheduled_at = Column(DateTime(timezone=True), nullable=True)

    events = relationship("CampaignEvent", back_populates="campaign")


class CampaignEvent(Base):
    __tablename__ = "campaign_events"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(Uuid(as_uuid=True), ForeignKey("campaigns.id"))
    contact_id = Column(Uuid(as_uuid=True), ForeignKey("contacts.id"))
    status = Column(String(20), default='queued') # queued, sent, failed
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True) # Data da resposta do cliente

    campaign = relationship("Campaign", back_populates="events")
    contact = relationship("Contact")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True)
    daily_limit = Column(Integer, default=500)
    hourly_limit = Column(Integer, default=50)
    min_interval_seconds = Column(Integer, default=15)
    max_interval_seconds = Column(Integer, default=45)
    working_hours_start = Column(String(5), default="08:00")
    working_hours_end = Column(String(5), default="20:00")
    is_active = Column(Boolean, default=True) # Global Disparo Switch
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AIConfig(Base):
    __tablename__ = "ai_config"
    
    id = Column(Integer, primary_key=True)
    is_active = Column(Boolean, default=False)
    system_prompt = Column(Text, default="Você é uma secretária virtual da clínica. Seu tom é simpático e profissional. Objetivo: Agendar avaliação.")
    model_name = Column(String, default="gpt-4o")
    whitelist_numbers = Column(JSON, default=[]) # Lista de números para teste (responde sempre)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

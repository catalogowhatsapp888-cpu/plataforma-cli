import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, DECIMAL, ARRAY, Date, Uuid, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

# ==========================================
# Core Multi-tenant Models
# ==========================================

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    document_id = Column(String(20), nullable=True) # CNPJ/CPF
    status = Column(String(20), default='active')   # active, inactive, suspended
    config = Column(JSON, nullable=True, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="tenant")


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True) # Nullable temporário para migração
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default='vendedor') # admin, supervisor, vendedor, leitor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    tenant = relationship("Tenant", back_populates="users")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)     # LOGIN, CREATE, UPDATE, DELETE, EXPORT
    resource = Column(String(50), nullable=False)   # User, Contact, Campaign
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)           # Cópia dos dados, diff, etc.
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# ==========================================
# Business Models (Tenant-Aware)
# ==========================================

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True) # Nullable for migration
    
    full_name = Column(String(255))
    phone_e164 = Column(String(20), nullable=False) # Unique constraint deve ser composta com tenant_id (future)
    email = Column(String(255))
    cpf = Column(String(14))
    source = Column(String(50))
    type = Column(String(20), default='lead')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_interaction_at = Column(DateTime(timezone=True))
    opt_in = Column(Boolean, default=False)
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
    assigned_to = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True) # Agora aponta para User
    unread_count = Column(Integer, default=0)
    notes = Column(Text)

    contact = relationship("Contact", back_populates="lead_pipeline")
    assigned_user = relationship("User")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)

    contact_id = Column(Uuid(as_uuid=True), ForeignKey("contacts.id"))
    status = Column(String(20), default='open')
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True))

    contact = relationship("Contact", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)

    conversation_id = Column(Uuid(as_uuid=True), ForeignKey("conversations.id"))
    external_id = Column(String(100))
    direction = Column(String(10), nullable=False)
    content = Column(Text)
    content_type = Column(String(20), default='text')
    status = Column(String(20), default='queued')
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)

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
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)

    name = Column(String(255), nullable=False)
    status = Column(String(20), default='draft')
    audience_rules = Column(JSON, nullable=True)
    message_template = Column(Text, nullable=True)
    media_url = Column(String(500), nullable=True)
    excluded_contacts = Column(JSON, nullable=True, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scheduled_at = Column(DateTime(timezone=True), nullable=True)

    events = relationship("CampaignEvent", back_populates="campaign")


class CampaignEvent(Base):
    __tablename__ = "campaign_events"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Event não precisa de tenant_id se Campaign já tem, mas ajuda nos relatórios de performance
    # Por simplicidade, vou omitir aqui e confiar no JOIN com Campaign.

    campaign_id = Column(Uuid(as_uuid=True), ForeignKey("campaigns.id"))
    contact_id = Column(Uuid(as_uuid=True), ForeignKey("contacts.id"))
    status = Column(String(20), default='queued')
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)

    campaign = relationship("Campaign", back_populates="events")
    contact = relationship("Contact")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)

    daily_limit = Column(Integer, default=500)
    hourly_limit = Column(Integer, default=50)
    min_interval_seconds = Column(Integer, default=15)
    max_interval_seconds = Column(Integer, default=45)
    working_hours_start = Column(String(5), default="08:00")
    working_hours_end = Column(String(5), default="20:00")
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AIConfig(Base):
    __tablename__ = "ai_config"
    
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)

    is_active = Column(Boolean, default=False)
    system_prompt = Column(Text, default="Você é uma secretária virtual.")
    model_name = Column(String, default="gpt-4o")
    whitelist_numbers = Column(JSON, default=[])
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid(as_uuid=True), ForeignKey("tenants.id"), nullable=True)

    title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True) # Caminho físico ou URL
    raw_content = Column(Text, nullable=True) # Texto extraído
    is_processed = Column(Boolean, default=False) # Se já foi indexado
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(Uuid(as_uuid=True), ForeignKey("knowledge_documents.id"))

    chunk_text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True) # Armazena vetor como Lista JSON
    chunk_index = Column(Integer)

    document = relationship("KnowledgeDocument", back_populates="chunks")

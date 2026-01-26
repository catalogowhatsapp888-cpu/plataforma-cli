from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class KnowledgeDocumentBase(BaseModel):
    title: str

class KnowledgeDocumentCreate(KnowledgeDocumentBase):
    pass

class KnowledgeDocumentSchema(KnowledgeDocumentBase):
    id: UUID
    file_path: Optional[str] = None
    is_processed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class SearchResult(BaseModel):
    chunk_text: str
    score: float
    document_title: str

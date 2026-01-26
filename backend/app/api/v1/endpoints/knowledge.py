from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.api import deps
from app.models.models import User, KnowledgeDocument
from app.schemas.knowledge import KnowledgeDocumentSchema, SearchResult
from app.services.knowledge_service import knowledge_service
import shutil
import os
import uuid

router = APIRouter()

def background_process_doc(doc_id: uuid.UUID, file_path: str):
    """Wrapper para rodar em background com sessão própria"""
    db = SessionLocal()
    try:
        knowledge_service.process_document(db, doc_id, file_path)
    finally:
        db.close()

@router.post("/upload", response_model=KnowledgeDocumentSchema)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Apenas arquivos PDF são suportados.")
    
    # Define Path
    upload_dir = f"dados_entrada/knowledge/{current_user.tenant_id}"
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_name)
    
    # Save File
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create DB Entry
    doc = KnowledgeDocument(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        title=title or file.filename,
        file_path=file_path,
        is_processed=False
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Trigger Processing
    background_tasks.add_task(background_process_doc, doc.id, file_path)
    
    return doc

@router.get("/", response_model=list[KnowledgeDocumentSchema])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return db.query(KnowledgeDocument).filter(
        KnowledgeDocument.tenant_id == current_user.tenant_id
    ).order_by(KnowledgeDocument.created_at.desc()).all()

@router.delete("/{doc_id}")
def delete_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    doc = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.id == doc_id,
        KnowledgeDocument.tenant_id == current_user.tenant_id
    ).first()
    if not doc: raise HTTPException(404, "Document not found")
    
    # Delete file? Yes
    if doc.file_path and os.path.exists(doc.file_path):
        try: os.remove(doc.file_path)
        except: pass
        
    db.delete(doc)
    db.commit()
    return {"success": True}

@router.post("/search", response_model=list[SearchResult])
def test_search(
    query: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Teste de busca semântica"""
    results = knowledge_service.search(db, query, current_user.tenant_id)
    return results

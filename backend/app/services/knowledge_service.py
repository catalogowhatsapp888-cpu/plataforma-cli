import os
import uuid
import logging
import json
import numpy as np
import pypdf
from sqlalchemy.orm import Session
from app.models.models import KnowledgeDocument, KnowledgeChunk
from openai import OpenAI

# Initialize OpenAI client globally? better inside method or check env
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class KnowledgeService:
    def _get_client(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logging.error("OPENAI_API_KEY not found")
            return None
        return OpenAI(api_key=api_key)

    def process_document(self, db: Session, doc_id: uuid.UUID, file_path: str):
        """Lê PDF, quebra em chunks, gera embeddings e salva."""
        logging.info(f"Processing PDF: {file_path}")
        
        # 1. Extrair Texto
        text = ""
        try:
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                extract = page.extract_text()
                if extract: text += extract + "\n"
        except Exception as e:
            logging.error(f"Error reading PDF: {e}")
            return False

        if not text.strip():
            logging.warning("PDF vazio ou ilegível (imagem?)")
            return False

        # 2. Chunking
        chunk_size = 800
        overlap = 100
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += (chunk_size - overlap)

        logging.info(f"Generated {len(chunks)} chunks.")

        # 3. Embedding & Save
        doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == doc_id).first()
        if not doc: return False
        
        doc.raw_content = text # Salva o texto bruto extraído
        
        # Limpa chunks antigos se houver (reprocessamento)
        # db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == doc.id).delete()
        
        client = self._get_client()
        if not client: return False

        for i, chunk_text in enumerate(chunks):
            embedding = self._get_embedding(client, chunk_text)
            if not embedding: continue
            
            chunk_db = KnowledgeChunk(
                id=uuid.uuid4(),
                document_id=doc.id,
                chunk_text=chunk_text,
                embedding=embedding, # Salva como lista JSON
                chunk_index=i
            )
            db.add(chunk_db)
        
        doc.is_processed = True
        db.commit()
        logging.info("Document processed successfully and indexed.")
        return True

    def _get_embedding(self, client, text):
        try:
            # Substitui newlines para melhorar performance do embedding
            text = text.replace("\n", " ")
            response = client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            logging.error(f"Embedding error: {e}")
            return []

    def search(self, db: Session, query: str, tenant_id: uuid.UUID, limit=3, threshold=0.3):
        """Busca chunks relevantes usando similaridade de cosseno manual."""
        client = self._get_client()
        if not client: return []

        query_vec = self._get_embedding(client, query)
        if not query_vec: return []

        # Pega todos os chunks DO TENANT (Join Document)
        # Atenção: Isso carrega todos os vetores do tenant na RAM. 
        # Para <1000 páginas ok. Para >10k precisa de pgvector.
        chunks = db.query(KnowledgeChunk).join(KnowledgeDocument).filter(
            KnowledgeDocument.tenant_id == tenant_id,
            KnowledgeDocument.is_processed == True
        ).all()
        
        if not chunks: return []

        results = []
        q_vec = np.array(query_vec)
        q_norm = np.linalg.norm(q_vec)

        for chunk in chunks:
            if not chunk.embedding: continue
            # Embedding stored as list in JSON field
            c_vec = np.array(chunk.embedding)
            c_norm = np.linalg.norm(c_vec)
            
            if c_norm == 0 or q_norm == 0:
                sim = 0
            else:
                sim = np.dot(q_vec, c_vec) / (q_norm * c_norm)
            
            if sim >= threshold:
                results.append((sim, chunk))
            
        # Ordena desc
        results.sort(key=lambda x: x[0], reverse=True)
        
        # Formata saída
        final_output = []
        for score, chunk in results[:limit]:
            final_output.append({
                "chunk_text": chunk.chunk_text,
                "score": float(score),
                "document_title": chunk.document.title
            })
            
        return final_output

knowledge_service = KnowledgeService()

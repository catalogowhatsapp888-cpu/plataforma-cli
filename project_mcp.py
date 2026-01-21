import sys
import os
from pathlib import Path

# Adicionar backend ao path para imports funcionarem
current_dir = Path(__file__).parent
backend_dir = current_dir / "backend"
sys.path.append(str(backend_dir))

from fastmcp import FastMCP
from app.db.session import SessionLocal
from app.models.models import Contact, Conversation, Message as DBMessage # evitar conflito nome
from app.services.evolution_service import evolution_service
import json

# Inicializa Servidor MCP
mcp = FastMCP("Plataforma Clinica")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@mcp.tool()
def listar_leads() -> str:
    """Lista todos os leads cadastrados no pipeline, mostrando ID, Nome, Telefone e Temperatura."""
    db = SessionLocal()
    try:
        leads = db.query(Contact).all()
        result = []
        for l in leads:
            temp = "N/A"
            stage = "N/A"
            if l.lead_pipeline:
                 temp = l.lead_pipeline.temperature or "N/A"
                 stage = l.lead_pipeline.stage or "N/A"
            
            result.append({
                "id": str(l.id),
                "nome": l.full_name,
                "telefone": l.phone,
                "temperatura": temp,
                "estagio": stage
            })
        return json.dumps(result, indent=2, ensure_ascii=False)
    finally:
        db.close()

@mcp.tool()
def ver_conversa(lead_id: str) -> str:
    """Retorna o histórico de conversas (mensagens) de um lead específico pelo seu ID."""
    db = SessionLocal()
    try:
        # Busca unificada simples (prioriza local para rapidez no MCP)
        # Poderíamos usar a logica completa do leads.py se quiséssemos
        msgs = db.query(DBMessage).join(Conversation).filter(Conversation.contact_id == lead_id).order_by(DBMessage.timestamp).all()
        
        history = []
        for m in msgs:
            history.append(f"[{m.timestamp}] {m.direction.upper()}: {m.content}")
            
        if not history:
            return "Nenhuma mensagem encontrada localmente."
            
        return "\n".join(history)
    finally:
        db.close()

@mcp.tool()
def enviar_whatsapp(lead_id: str, mensagem: str) -> str:
    """Envia uma mensagem de WhatsApp para um lead."""
    db = SessionLocal()
    try:
        contact = db.query(Contact).filter(Contact.id == lead_id).first()
        if not contact:
            return "Erro: Lead não encontrado."
            
        # Enviar via Service
        resp = evolution_service.send_message(contact.phone_e164, mensagem)
        
        if "error" in resp:
            return f"Erro ao enviar: {resp['error']}"
            
        return f"Mensagem enviada com sucesso! ID: {resp.get('key', {}).get('id')}"
    finally:
        db.close()

if __name__ == "__main__":
    print("Iniciando Servidor MCP Plataforma Clínica...")
    mcp.run()

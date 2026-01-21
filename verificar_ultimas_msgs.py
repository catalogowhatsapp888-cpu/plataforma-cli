import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.session import SessionLocal
from app.models.models import Message, Contact
from sqlalchemy import desc
import datetime

db = SessionLocal()

print("🔍 Verificando últimas 10 mensagens no banco...")
msgs = db.query(Message).order_by(desc(Message.timestamp)).limit(10).all()

if not msgs:
    print("❌ Nenhuma mensagem encontrada no banco.")
else:
    for m in msgs:
        # Simplificado para evitar erro de Join agora
        print(f"[{m.timestamp}] {m.direction.upper()} | ConvID: {m.conversation_id} | Msg: {m.content[:50]}...")

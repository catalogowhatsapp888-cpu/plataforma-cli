import requests
import sys
import os
from pathlib import Path

# Adiciona 'backend' ao path para resolver imports 'app.*'
sys.path.append(str(Path(__file__).parent / "backend"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Contact, Conversation, Message
from app.db.session import SessionLocal
import datetime
import uuid

# Configurar conexão com Banco
# Precisamos ajustar o path se estiver usando sqlite relativo
# O URL original é "sqlite:///./sql_app.db" (no .env ou config)
# Vamos assumir que o script roda na raiz e o banco está em ./backend/sql_app.db ou ./sql_app.db

db_path = "backend/plataforma.db" # Ajuste conforme seu .env real, vou tentar ler do arquivo se falhar
# Mas vamos tentar conectar via API do Webhook que é mais garantido, pois usa a lógica real

def test_via_webhook():
    print("Simulando webhook de mensagem recebida...")
    
    # 1. Preciso de um telefone válido que exista no banco
    # Vou buscar um via API primeiro ou hardcode
    # Vamos tentar conectar no banco direto pra pegar um ID
    
    try:
        from app.db.session import SessionLocal
        db = SessionLocal()
        
        # Buscar cliente específico "a teste"
        # Tenta achar por nome parcial
        contact = db.query(Contact).filter(Contact.full_name.ilike("%teste%")).first()
        
        if not contact:
            print("❌ Nenhum contato com 'teste' no nome encontrado. Pegando o primeiro geral...")
            contact = db.query(Contact).first()

        if not contact:
            print("❌ Banco vazio.")
            return
            
        print(f"Teste com contato: {contact.full_name} ({contact.phone_e164})")
        
        # Payload simulando Evolution API
        payload = {
            "type": "MESSAGES_UPSERT",
            "data": {
                "key": {
                    "remoteJid": f"{contact.phone_e164.replace('+', '')}@s.whatsapp.net",
                    "fromMe": False,
                    "id": f"TEST-{uuid.uuid4()}"
                },
                "pushName": "Cliente Teste",
                "message": {
                    "conversation": f"Olá {contact.full_name}! Teste de recebimento {datetime.datetime.now().strftime('%H:%M:%S')}"
                },
                "messageTimestamp": int(datetime.datetime.now().timestamp())
            }
        }
        
        headers = {"Content-Type": "application/json"}
        # Assumindo backend rodando na 8000
        url = "http://127.0.0.1:8000/api/v1/webhook/"
        
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"Status Webhook: {response.status_code}")
        print(f"Resposta: {response.json()}")
        
        if response.status_code == 200 and response.json().get('status') == 'processed':
            print("\n✅ SUCESSO! A mensagem foi injetada.")
            print("👉 Agora abra o chat desse lead no navegador. A mensagem deve aparecer lá.")
        else:
            print("\n❌ Falha na injeção via webhook.")

    except Exception as e:
        print(f"Erro no script: {e}")

if __name__ == "__main__":
    test_via_webhook()

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from app.db.session import engine
from app.db.base import Base
from app.models.models import SystemSettings, CampaignEvent 
from sqlalchemy import text

def update_db():
    print("🔄 Iniciando atualização do Schema...")
    
    # 1. Criar tabelas que não existem (SystemSettings)
    print("📦 Criando novas tabelas (se necessário)...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Adicionar coluna sent_at se não existir
    print("🔧 Verificando coluna sent_at em campaign_events...")
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT sent_at FROM campaign_events LIMIT 1"))
            print("✅ Coluna 'sent_at' já existe.")
        except Exception:
            print("⚠️ Coluna 'sent_at' ausente. Adicionando...")
            try:
                conn.execute(text("ALTER TABLE campaign_events ADD COLUMN sent_at DATETIME"))
                conn.commit() # Importante para SQLite
                print("✅ Coluna adicionada com sucesso.")
            except Exception as e:
                print(f"❌ Erro ao adicionar coluna: {e}")

    # 3. Inicializar SystemSettings se vazio
    from sqlalchemy.orm import Session
    session = Session(bind=engine)
    try:
        settings = session.query(SystemSettings).first()
        if not settings:
            print("⚙️ Inicializando configurações padrão...")
            default_settings = SystemSettings() # Usa defaults do model
            session.add(default_settings)
            session.commit()
            print("✅ Configurações criadas.")
        else:
            print("✅ Configurações já existem.")
    finally:
        session.close()

    print("🚀 Banco de dados atualizado.")

if __name__ == "__main__":
    update_db()

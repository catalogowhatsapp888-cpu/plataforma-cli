from sqlalchemy import create_engine, text
import logging

DATABASE_URL = "sqlite:///./clinica.db"

def migrate():
    print("🚀  Iniciando Migração de Eventos (Resposta)...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("⏳ Adicionando coluna 'replied_at' em 'campaign_events'...")
            stmt = text("ALTER TABLE campaign_events ADD COLUMN replied_at DATETIME NULL;")
            connection.execute(stmt)
            connection.commit()
            print("✅ Sucesso!")
    except Exception as e:
        if "duplicate column name" in str(e):
            print("✅ A coluna já existe.")
        else:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    migrate()

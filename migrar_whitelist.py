from sqlalchemy import create_engine, text
import logging

DATABASE_URL = "sqlite:///./clinica.db"

def migrate():
    print("🚀  Iniciando Migração Whitelist...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            print("⏳ Adicionando coluna 'whitelist_numbers' em 'ai_config'...")
            stmt = text("ALTER TABLE ai_config ADD COLUMN whitelist_numbers JSON DEFAULT '[]';")
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

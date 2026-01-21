from sqlalchemy import create_engine, text
import logging

# Configuração igual ao backend
DATABASE_URL = "sqlite:///./clinica.db"

def migrate():
    print("🚀  Iniciando Migração Manual...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            # Debug: Listar tabelas
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            print("📜 Tabelas encontradas:", [row[0] for row in result])
            
            print("⏳ Adicionando coluna 'unread_count' na tabela 'leads_pipeline'...")
            
            # SQLite safe add column
            stmt = text("ALTER TABLE leads_pipeline ADD COLUMN unread_count INTEGER DEFAULT 0;")
            connection.execute(stmt)
            connection.commit()
            
            print("✅ Sucesso!")
    except Exception as e:
        if "duplicate column name" in str(e):
            print("✅ A coluna já existe. Nenhuma ação necessária.")
        else:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    migrate()

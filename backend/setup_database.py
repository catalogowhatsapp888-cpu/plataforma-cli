import sys
import os
from sqlalchemy import text # type: ignore

# Add current dir to path to allow 'app' import
sys.path.append(os.getcwd())

from app.db.session import engine
from app.db.base import Base
# Import all models so Base knows them
from app.models import models

def setup_db():
    print("🚀 Inicializando Banco de Dados...")
    try:
        # 1. Create Tables using SQLAlchemy Models
        print("🛠️  Criando tabelas (Create All)...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas verificadas/criadas.")

        # 2. Manual Patches (if needed for existing DBs)
        # Check specific columns that might have been added manually later
        with engine.connect() as conn:
            # Example: check 'unread_count' in leads_pipeline
            try:
                conn.execute(text("ALTER TABLE leads_pipeline ADD COLUMN unread_count INTEGER DEFAULT 0;"))
                print("✅ Coluna 'unread_count' adicionada.")
            except Exception:
                pass # Already exists
            
            # Check 'is_opt_out' in contacts
            try:
                conn.execute(text("ALTER TABLE contacts ADD COLUMN is_opt_out BOOLEAN DEFAULT 0;"))
                print("✅ Coluna 'is_opt_out' adicionada.")
            except Exception:
                pass
            
            # Check 'opt_in' in contacts
            try:
                conn.execute(text("ALTER TABLE contacts ADD COLUMN opt_in BOOLEAN DEFAULT 0;"))
                print("✅ Coluna 'opt_in' adicionada.")
            except Exception:
                pass

    except Exception as e:
        print(f"❌ Erro no setup_db: {e}")

if __name__ == "__main__":
    setup_db()

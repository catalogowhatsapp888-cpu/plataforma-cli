from app.db.session import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN is_opt_out BOOLEAN DEFAULT FALSE"))
            print("✅ Coluna is_opt_out adicionada com sucesso.")
            conn.commit()
        except Exception as e:
            print(f"⚠️ Erro ao adicionar coluna (pode já existir): {e}")

if __name__ == "__main__":
    migrate()

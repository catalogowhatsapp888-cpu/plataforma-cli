from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"🔌 Tentando conectar em: {DATABASE_URL.split('@')[-1]}") # Esconde senha

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Conexão com Supabase OK!")
except Exception as e:
    print(f"❌ Erro ao conectar: {e}")

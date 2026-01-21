from sqlalchemy import create_engine, text
import json
DATABASE_URL = "sqlite:///./clinica.db"
engine = create_engine(DATABASE_URL)
with engine.connect() as cx:
    res = cx.execute(text("SELECT whitelist_numbers FROM ai_config")).fetchone()
    print(f"WHITELIST NO BANCO: {res[0] if res else 'NADA'}")

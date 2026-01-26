import sqlite3
import uuid
from passlib.context import CryptContext

# Configuração de Senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DB_PATH = "clinica.db"
MASTER_EMAIL = "eduschefer@icloud.com"
MASTER_PASS = "123456"

def get_password_hash(password):
    return pwd_context.hash(password)

def fix_master_user():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print(f"🔧 Check e Correção do Usuário Master: {MASTER_EMAIL}")
    
    # Clean previous broken user
    cursor.execute("DELETE FROM users WHERE email = ?", (MASTER_EMAIL,))
    if cursor.rowcount > 0:
        print(f"🗑️ Usuário antigo removido (para recriar com ID correto)")
    
    # 1. Obter Tenant Default
    cursor.execute("SELECT id FROM tenants LIMIT 1")
    tenant = cursor.fetchone()
    if not tenant:
        print("❌ Nenhum tenant encontrado! Criando Default...")
        tenant_id = str(uuid.uuid4()) # Tenants always use 36 chars (Unicode 36)
        cursor.execute("INSERT INTO tenants (id, name, status) VALUES (?, ?, ?)", (tenant_id, "Default Company", "active"))
    else:
        tenant_id = tenant[0]
        print(f"✅ Tenant Default encontrado: {tenant_id}")

    # 2. Criar Usuário (HEX UUID)
    # SQLAlchemy Uuid(as_uuid=True) defaults to CHAR(32) -> HEX
    user_uuid = uuid.uuid4()
    user_id_hex = user_uuid.hex # NO DASHES
    
    hashed = get_password_hash(MASTER_PASS)
    
    print(f"DEBUG: Creating user with ID (hex): {user_id_hex} (len={len(user_id_hex)})")
    
    cursor.execute("""
        INSERT INTO users (id, email, hashed_password, name, role, is_active, tenant_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id_hex, MASTER_EMAIL, hashed, "Eduardo Master", "admin", True, tenant_id))
    
    print("✅ Usuário criado com sucesso (ID Hex fixed).")

    # 3. Vincular Dados Orfãos
    tables = ["contacts", "campaigns", "conversations", "messages"]
    for table in tables:
        try:
            cursor.execute(f"UPDATE {table} SET tenant_id = ? WHERE tenant_id IS NULL", (tenant_id,))
            if cursor.rowcount > 0:
                print(f"✅ {cursor.rowcount} registros em '{table}' vinculados ao tenant default.")
        except Exception as e:
            print(f"Erro ao atualizar {table}: {e}")

    conn.commit()
    conn.close()
    print("\n🚀 Correção concluída! Tente logar novamente.")

if __name__ == "__main__":
    fix_master_user()

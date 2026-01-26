import sqlite3
import uuid

DB_PATH = "clinica.db"

def fix_tenant_hex():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🔧 Normalizando Tenant IDs para HEX (32 chars)...")
    
    # 1. Encontrar Tenant atual (com dashes)
    cursor.execute("SELECT id FROM tenants LIMIT 1")
    row = cursor.fetchone()
    
    if not row:
        print("❌ Nenhum tenant encontrado para corrigir.")
        conn.close()
        return

    old_tenant_id = row[0]
    print(f"👉 Tenant Encontrado: {old_tenant_id} (len={len(old_tenant_id)})")
    
    if len(old_tenant_id) == 32 and "-" not in old_tenant_id:
        print("✅ Tenant ID já está em formato HEX.")
        conn.close()
        return

    # Se tem dashes, vamos criar um novo em HEX e migrar tudo
    # Ou simplesmente converter a string?
    # O user tenant_id tb é string.
    
    # Create new UUID from the old one to keep same entropy but hex format
    try:
        u_obj = uuid.UUID(old_tenant_id)
        new_tenant_id = u_obj.hex
    except:
        # Se for inválido, gera novo
        new_tenant_id = uuid.uuid4().hex
        
    print(f"🔄 Migrando de {old_tenant_id} para {new_tenant_id}...")
    
    # Update Tenant ID (SQL update on PK is okay)
    try:
        # Disable FK checks temporarily just in case
        cursor.execute("PRAGMA foreign_keys = OFF")
        
        cursor.execute("UPDATE tenants SET id = ? WHERE id = ?", (new_tenant_id, old_tenant_id))
        print(f"✅ Tabela tenants atualizada.")
        
        # Update Users
        # User.tenant_id is defined as Uuid(as_uuid=True), but in SQLite users schema it is CHAR(36) or blob.
        # But wait, User.tenant_id in User model is Uuid.
        # We should store HEX in User.tenant_id column too if User calls query on it.
        # Let's update all FK references to the new HEX id.
        
        tables_with_tenant = ["users", "contacts", "campaigns", "conversations", "messages", "procedures", "ai_config", "system_settings", "audit_logs"]
        
        for table in tables_with_tenant:
            try:
                # Check if table has tenant_id column
                cursor.execute(f"PRAGMA table_info({table})")
                cols = [c[1] for c in cursor.fetchall()]
                if "tenant_id" in cols:
                    cursor.execute(f"UPDATE {table} SET tenant_id = ? WHERE tenant_id = ?", (new_tenant_id, old_tenant_id))
                    print(f"  -> {table}: {cursor.rowcount} registros atualizados.")
            except Exception as e:
                print(f"  ❌ Erro em {table}: {e}")
                
        cursor.execute("PRAGMA foreign_keys = ON")
        conn.commit()
        print("🚀 Migração para Tenant HEX concluída com sucesso.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Erro fatal: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_tenant_hex()

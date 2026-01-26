import sqlite3
import uuid
from datetime import datetime

DB_PATH = "clinica.db"

def get_connection():
    return sqlite3.connect(DB_PATH)

def table_exists(cursor, table_name):
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    return cursor.fetchone() is not None

def column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    for col in columns:
        if col[1] == column_name:
            return True
    return False

def migrate():
    conn = get_connection()
    cursor = conn.cursor()

    print("🚀 Iniciando migração para V1.4 (Multi-tenant)...")

    # 1. Criar Tabela Tenants
    if not table_exists(cursor, "tenants"):
        print("Creating table: tenants")
        cursor.execute("""
            CREATE TABLE tenants (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                document_id VARCHAR(20),
                status VARCHAR(20) DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
    
    # 2. Criar Tabela Audit Logs
    if not table_exists(cursor, "audit_logs"):
        print("Creating table: audit_logs")
        cursor.execute("""
            CREATE TABLE audit_logs (
                id CHAR(36) PRIMARY KEY,
                tenant_id CHAR(36),
                user_id CHAR(36),
                action VARCHAR(50) NOT NULL,
                resource VARCHAR(50) NOT NULL,
                resource_id VARCHAR(100),
                details JSON,
                ip_address VARCHAR(50),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(tenant_id) REFERENCES tenants(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)

    # 3. Criar Tenant Default
    cursor.execute("SELECT id FROM tenants LIMIT 1")
    default_tenant = cursor.fetchone()
    if not default_tenant:
        tenant_id = str(uuid.uuid4())
        print(f"Creating Default Tenant: {tenant_id}")
        cursor.execute("INSERT INTO tenants (id, name, status) VALUES (?, ?, ?)", (tenant_id, "Default Company", "active"))
        conn.commit()
    else:
        tenant_id = default_tenant[0]
        print(f"Default Tenant exists: {tenant_id}")

    # 4. Adicionar tenant_id em tabelas existentes
    target_tables = ["users", "contacts", "conversations", "messages", "procedures", "campaigns", "system_settings", "ai_config"]
    
    for table in target_tables:
        if not table_exists(cursor, table):
            print(f"Skipping {table} (not found)")
            continue
            
        if not column_exists(cursor, table, "tenant_id"):
            print(f"Adding tenant_id to {table}")
            try:
                # Add column nullable initially
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN tenant_id CHAR(36)")
                
                # Update existing records to default tenant
                cursor.execute(f"UPDATE {table} SET tenant_id = ? WHERE tenant_id IS NULL", (tenant_id,))
                
                # Create FK (SQLite doesn't support ADD CONSTRAINT easily without recreate, skipping strict FK constraint for migration simplicity on SQLite, app logic handles it)
                # But we definitely valid tenant_id
            except Exception as e:
                print(f"Error migrating {table}: {e}")

    # 5. User Specific Migrations
    if table_exists(cursor, "users"):
        # Ensure role exists (it was in previous models, check if migration needed)
        pass # It was already there.
        
        # Ensure last_login_at exists
        if not column_exists(cursor, "users", "last_login_at"):
            print("Adding last_login_at to users")
            cursor.execute("ALTER TABLE users ADD COLUMN last_login_at DATETIME")

    conn.commit()
    conn.close()
    print("✅ Migração V1.4 Concluída com Sucesso.")

if __name__ == "__main__":
    migrate()

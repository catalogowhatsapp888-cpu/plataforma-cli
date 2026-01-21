from sqlalchemy import create_engine, text
import logging

# Configuração igual ao backend
DATABASE_URL = "sqlite:///./clinica.db"

def migrate():
    print("🚀  Iniciando Migração V1.1.0...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            
            # 1. Adicionar is_active em contacts
            print("⏳ Atualizando Tabela 'contacts' (is_active)...")
            try:
                connection.execute(text("ALTER TABLE contacts ADD COLUMN is_active BOOLEAN DEFAULT 1;"))
                print("   ✅ Coluna 'is_active' adicionada.")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print("   ℹ️ Coluna 'is_active' já existe.")
                else:
                    print(f"   ℹ️ Aviso (pode ser normal): {e}")

            # 2. Criar Tabela Campaigns
            print("⏳ Criando Tabela 'campaigns'...")
            sql_campaigns = """
            CREATE TABLE IF NOT EXISTS campaigns (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                audience_rules TEXT,
                message_template TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                scheduled_at DATETIME
            );
            """
            connection.execute(text(sql_campaigns))
            print("   ✅ Tabela 'campaigns' verificada.")

            # 3. Criar Tabela CampaignEvents
            print("⏳ Criando Tabela 'campaign_events'...")
            sql_events = """
            CREATE TABLE IF NOT EXISTS campaign_events (
                id CHAR(36) PRIMARY KEY,
                campaign_id CHAR(36),
                contact_id CHAR(36),
                status VARCHAR(20) DEFAULT 'queued',
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(contact_id) REFERENCES contacts(id)
            );
            """
            connection.execute(text(sql_events))
            print("   ✅ Tabela 'campaign_events' verificada.")
            
            connection.commit()
            print("\n🎉 Migração V1.1.0 Concluída com Sucesso!")
            
    except Exception as e:
        print(f"❌ Erro Crítico: {e}")

if __name__ == "__main__":
    migrate()

import os
import shutil
import datetime
import sqlite3
import hashlib

# Configurações
SOURCE_DIR = os.getcwd()
PARENT_DIR = os.path.dirname(SOURCE_DIR)
BACKUP_BASE_DIR = os.path.join(PARENT_DIR, "V1.3 Estavel")
TODAY_STR = datetime.date.today().strftime("%Y_%m_%d")
VERSION_NAME = f"version_1.3_stable_{TODAY_STR}"
TARGET_DIR = os.path.join(BACKUP_BASE_DIR, VERSION_NAME)

# Pastas a ignorar (economizar espaço e tempo)
IGNORE_PATTERNS = shutil.ignore_patterns(
    "node_modules", 
    "venv", 
    ".next", 
    "__pycache__", 
    ".git", 
    ".DS_Store",
    "*.log", 
    "*.tmp",
    ".pytest_cache",
    "V1.2 Estavel" # Evitar recursão
)

def ensure_directories():
    if not os.path.exists(BACKUP_BASE_DIR):
        os.makedirs(BACKUP_BASE_DIR)
        print(f"📁 Pasta base criada: {BACKUP_BASE_DIR}")
    
    if os.path.exists(TARGET_DIR):
        print(f"⚠️ A pasta de versão {TARGET_DIR} já existe.")
        print("Abortando para evitar sobrescrita de versão estável.")
        exit(1)

def backup_files():
    print(f"📦 Copiando arquivos de {SOURCE_DIR} para {TARGET_DIR}...")
    shutil.copytree(SOURCE_DIR, TARGET_DIR, ignore=IGNORE_PATTERNS)
    print("✅ Cópia de arquivos concluída (ignorando node_modules/venv).")

def safe_db_backup():
    """Realiza backup seguro do SQLite mesmo com banco em uso."""
    db_source = os.path.join(SOURCE_DIR, "clinica.db")
    db_dest = os.path.join(TARGET_DIR, "clinica.db")
    
    if os.path.exists(db_source):
        print(f"💾 Realizando snapshot seguro do banco de dados...")
        try:
            src_conn = sqlite3.connect(db_source)
            dst_conn = sqlite3.connect(db_dest)
            with dst_conn:
                src_conn.backup(dst_conn)
            dst_conn.close()
            src_conn.close()
            print("✅ Banco de dados 'clinica.db' backupeado com integridade.")
        except Exception as e:
            print(f"❌ Erro ao fazer backup do banco: {e}")
            try:
                shutil.copy2(db_source, db_dest)
                print("⚠️ Usado fallback de cópia simples para o banco.")
            except:
                print("❌ Falha total no backup do banco.")

def generate_checksums():
    print("🔐 Gerando hash de integridade (SHA256)...")
    checksum_file = os.path.join(TARGET_DIR, "checksums.txt")
    with open(checksum_file, "w") as f:
        for root, dirs, files in os.walk(TARGET_DIR):
            for file in files:
                if file == "checksums.txt": continue
                filepath = os.path.join(root, file)
                relpath = os.path.relpath(filepath, TARGET_DIR)
                try:
                    sha256_hash = hashlib.sha256()
                    with open(filepath, "rb") as fi:
                        for byte_block in iter(lambda: fi.read(4096), b""):
                            sha256_hash.update(byte_block)
                    f.write(f"{sha256_hash.hexdigest()}  {relpath}\n")
                except Exception as e:
                    print(f"⚠️ Erro ao gerar hash para {relpath}: {e}")
    print("✅ Arquivo checksums.txt gerado.")

def create_readme():
    print("📝 Gerando README.md da versão 1.3...")
    readme_content = f"""# Versão 1.3 Estável - {TODAY_STR}

## Status
**Status da Versão:** ✅ ESTÁVEL / WHITE LABEL

## Informações do Release
- **Data de Fechamento:** {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Responsável:** Antigravity AI Agent
- **Projeto:** Plataforma Clínica (Superserver)

## Funcionalidades Incluídas na V1.3
1. **White Label & Customização Visual 🎨:**
   - Novo nome da aplicação: **"Superserver"**.
   - **Upload de Logo:** Implementação Drag & Drop na Sidebar para alterar o logo da clínica.
   - **Favicon Personalizado:** Ícone da aplicação atualizado.
   - **Padronização de UI:** Cabeçalhos unificados em todas as páginas (Dashboard, Campanhas, AI, Pipeline, etc.).

2. **Gestão de Dados 💾:**
   - **Importação de Leads:** Nova funcionalidade de Drag & Drop na aba Configurações.
   - Suporte a arquivos `.xlsx` e `.csv`.
   - **Deduplicação Inteligente:** Ignora automaticamente contatos já existentes baseando-se no telefone (E.164).

3. **Correções e Melhorias 🛠:**
   - **Campanhas:** Correção no worker de disparos, permitindo configuração flexível de horários (até 23:59).
   - **Fila de Mensagens:** Ajustes para garantir processamento de mensagens pendentes.

## Instruções de Restauração
Siga os mesmos procedimentos da V1.2 (instalar requirements.txt e npm install).
"""
    with open(os.path.join(TARGET_DIR, "README.md"), "w") as f:
        f.write(readme_content)

if __name__ == "__main__":
    ensure_directories()
    backup_files()
    safe_db_backup()
    create_readme()
    generate_checksums()
    
    print("\n========================================")
    print(f"🚀 Versão 1.3 Estável Fechada com Sucesso!")
    print(f"📍 Local: {TARGET_DIR}")
    print("========================================")

import os
import shutil
import datetime
import sqlite3
import hashlib

# Configurações
SOURCE_DIR = os.getcwd()
PARENT_DIR = os.path.dirname(SOURCE_DIR)
BACKUP_BASE_DIR = os.path.join(PARENT_DIR, "V1.2 Estavel")
TODAY_STR = datetime.date.today().strftime("%Y_%m_%d")
VERSION_NAME = f"version_stable_{TODAY_STR}"
TARGET_DIR = os.path.join(BACKUP_BASE_DIR, VERSION_NAME)

# Pastas a ignorar (economizar espaço e tempo, mantendo reprodutibilidade via lockfiles)
IGNORE_PATTERNS = shutil.ignore_patterns(
    "node_modules", 
    "venv", 
    ".next", 
    "__pycache__", 
    ".git", 
    ".DS_Store",
    "*.log", 
    "*.tmp",
    ".pytest_cache"
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
    # Copia a árvore de diretórios
    shutil.copytree(SOURCE_DIR, TARGET_DIR, ignore=IGNORE_PATTERNS)
    print("✅ Cópia de arquivos concluída (ignorando node_modules/venv).")

def safe_db_backup():
    """Realiza backup seguro do SQLite mesmo com banco em uso."""
    db_source = os.path.join(SOURCE_DIR, "clinica.db")
    db_dest = os.path.join(TARGET_DIR, "clinica.db")
    
    if os.path.exists(db_source):
        print(f"💾 Realizando snapshot seguro do banco de dados...")
        try:
            # Conecta ao banco original
            src_conn = sqlite3.connect(db_source)
            # Conecta ao banco de destino (cria novo)
            dst_conn = sqlite3.connect(db_dest)
            
            with dst_conn:
                src_conn.backup(dst_conn)
            
            dst_conn.close()
            src_conn.close()
            print("✅ Banco de dados 'clinica.db' backupeado com integridade.")
        except Exception as e:
            print(f"❌ Erro ao fazer backup do banco: {e}")
            # Fallback: tentar cópia simples se falhar API
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
                        # Lê em chunks para não estourar memória
                        for byte_block in iter(lambda: fi.read(4096), b""):
                            sha256_hash.update(byte_block)
                    
                    f.write(f"{sha256_hash.hexdigest()}  {relpath}\n")
                except Exception as e:
                    print(f"⚠️ Erro ao gerar hash para {relpath}: {e}")
    
    print("✅ Arquivo checksums.txt gerado.")

def create_readme():
    print("📝 Gerando README.md da versão...")
    readme_content = f"""# Versão Estável - {TODAY_STR}

## Status
**Status da Versão:** ✅ ESTÁVEL / FUNCIONANDO

## Informações do Release
- **Data de Fechamento:** {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Responsável:** Antigravity AI Agent
- **Projeto:** Plataforma Clínica (Automação IA + WhatsApp)

## Funcionalidades Incluídas
1. **Pipeline de Vendas Otimizado:** 3 colunas (Lead, Contactado, Responder Manual).
2. **Integração Evolution API:** Envio e recebimento real-time de mensagens WhatsApp.
3. **Chat Unificado:** Visualização de histórico corrigida (sem duplicatas) priorizando Evolution.
4. **Sistema de Campanhas:** Disparos em massa com settings de segurança (intervalos, working hours).
5. **Launcher:** Painel de Controle (Porta 3001) para gestão de processos.
6. **Worker de Background:** Processamento assíncrono de fila de campanhas.
7. **Correção de Timezone:** Fuso Horário definido para America/Sao_Paulo (BRT).

## Notas Técnicas
- As pastas `node_modules` e `venv` foram excluídas para reduzir tamanho.
- Use `package-lock.json` e `requirements.txt` para restaurar dependências exatas.

## Instruções de Restauração (Rollback)
Caso precise voltar para esta versão:

1. **Faça backup do ambiente atual** (se houver dados novos).
2. **Substitua os arquivos** do diretório de produção pelo conteúdo desta pasta.
3. **Reinstale Dependências:**
   - Backend:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     pip install -r backend/requirements.txt
     ```
   - Frontend:
     ```bash
     cd frontend
     npm install
     ```
   - Launcher:
     ```bash
     cd launcher
     npm install
     ```
4. **Banco de Dados:**
   - O arquivo `clinica.db` incluído aqui é um snapshot do momento do backup.

## Validação de Integridade
Verifique a integridade dos arquivos rodando:
`shasum -c checksums.txt` (ou equivalente no seu OS)
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
    print(f"🚀 Versão Estável Fechada com Sucesso!")
    print(f"📍 Local: {TARGET_DIR}")
    print("========================================")

#!/bin/bash

echo "🚀 Iniciando Configuração Automática (Modo Local)..."

# 1. Verificar/Criar Ambiente Virtual Python
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# 2. Ativar Ambiente Virtual
source venv/bin/activate

# 3. Instalar Dependências
echo "⬇️  Instalando bibliotecas necessárias..."
pip install -r backend/requirements.txt > /dev/null 2>&1

# 4. Configurar Variáveis de Ambiente para SQLite (Sem Docker)
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
export DATABASE_URL="sqlite:///./clinica.db"
# Clinicorp Mock mode
export CLINICORP_API_KEY=""
export CLINICORP_API_URL="https://api.clinicorp.com/v1"

echo "✅ Tudo pronto!"
echo "📡 Servidor rodando em: http://localhost:8000/docs"
echo "OBS: Para parar, pressione CTRL+C"
echo "---------------------------------------------------"

# 5. Rodar o Servidor
uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000

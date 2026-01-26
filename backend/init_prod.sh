#!/bin/bash

echo "🚀 Iniciando Configuração do Ambiente de Produção..."

# 1. Verificar Variáveis
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não definida."
    echo "Environment: DATABASE_URL=sqlite:////app/dados/clinica.db"
    exit 1
fi

# 2. Verificar Volume
if [ ! -d "/app/dados" ]; then
    echo "⚠️  Aviso: Pasta /app/dados não existe."
    mkdir -p /app/dados
fi

# 3. Setup Banco
echo "🛠️  Configurando Banco de Dados..."
python setup_database.py

# 4. Criar Admin
echo "👤 Criando Admin..."
python create_admin.py

echo "✅ PRONTO!"

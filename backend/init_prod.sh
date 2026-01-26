#!/bin/bash

echo "🚀 Iniciando Configuração do Ambiente de Produção..."

# 1. Verificar Variáveis Críticas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não definida."
    echo "Defina no Easypanel (Environment): DATABASE_URL=sqlite:////app/dados/clinica.db"
    exit 1
fi

# 2. Verificar Volume
if [ ! -d "/app/dados" ]; then
    echo "⚠️  Aviso: Pasta /app/dados não existe."
    echo "Você criou o Volume (Mount) no Easypanel? Se não, seus dados serão perdidos no próximo deploy."
    mkdir -p /app/dados
fi

# 3. Criar Banco de Dados (Migração V1.4 logic)
echo "🛠️  Migrando Banco de Dados..."
# O script migrar_db.py detecta tabelas faltantes e cria
python migrar_db.py
python migrar_db_optout.py

# 4. Criar Usuário Admin
echo "👤 Criando Usuário Admin Padrão..."
python criar_usuario_admin.py

echo "✅ Configuração Concluída!"
echo "Agora você pode acessar o sistema com: admin@admin.com / 123456"

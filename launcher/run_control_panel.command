#!/bin/bash

# Garante que o script roda no diretório correto
cd "$(dirname "$0")" || exit

echo "🎮 Iniciando Painel de Controle - Plataforma Clinica"
echo "=================================================="

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Por favor instale o Node.js."
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Instala dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do Launcher (primeira execução)..."
    npm install
fi

# Abre o navegador
echo "🌐 Abrindo interface no navegador..."
(sleep 2 && open "http://localhost:3001") &

# Roda o servidor
npm start

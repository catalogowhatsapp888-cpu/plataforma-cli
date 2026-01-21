#!/bin/bash

# Este script faz TUDO: Importa os dados do Excel e depois liga o sistema.

echo "====================================="
echo "🔄 PASSO 1: IMPORTAÇÃO DE DADOS"
echo "====================================="

# Garante que estamos na pasta certa
cd "$(dirname "$0")"

# Ativa o ambiente Python
source venv/bin/activate

# Roda o script de importação
python importar_leads.py

echo ""
echo "====================================="
echo "✅ Importação Finalizada!"
echo "🚀 PASSO 2: INICIANDO O SISTEMA"
echo "====================================="
echo ""

# Chama o script original que liga Backend e Frontend
./iniciar_tudo.sh

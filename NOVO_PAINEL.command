#!/bin/bash
PROJECT_PATH="/Users/eduardoschefer/Library/CloudStorage/GoogleDrive-catalogowhatsapp888@gmail.com/Meu Drive/Administrativo Geral/Automacao IA/plataforma-clinica/launcher"

if [ -d "$PROJECT_PATH" ]; then
    cd "$PROJECT_PATH"
    echo "✅ Pasta do projeto encontrada."
    echo "🚀 Iniciando Painel de Controle..."
    
    # Instalar dep se não existir
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências..."
        npm install
    fi
    
    # Abrir navegador em 3s (background)
    (sleep 3 && open "http://localhost:3001") &
    
    echo ""
    echo "=================================================="
    echo "⚠️  IMPORTANTE: NÃO FECHE ESTA JANELA PRETA!  ⚠️"
    echo "Se você fechar esta janela, o painel sai do ar."
    echo "Pode minimizar, mas mantenha aberta."
    echo "=================================================="
    echo ""
    
    npm start
else
    echo "❌ Erro: Pasta do projeto não encontrada em:"
    echo "$PROJECT_PATH"
    echo "Verifique se o Google Drive está montado."
    read -p "Pressione Enter para sair..."
fi

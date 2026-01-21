#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
PID_FILE="$PROJECT_ROOT/launcher/pids.json"

echo "🛑 Parando Plataforma..."

# Tenta ler PIDs para matar graciosamente (opcional no bash Mac, pois pkill é mais efetivo)
if [ -f "$PID_FILE" ]; then
    rm "$PID_FILE"
fi

# Cleanup agressivo para garantir
echo "   -> Parando Backend (uvicorn)..."
pkill -f "uvicorn app.main:app"

echo "   -> Parando Tunnel (ngrok)..."
pkill -f "ngrok http 8000"

echo "   -> Parando Frontend (node/next)..."
# Mata processos node rodando next
pkill -f "next-server"
pkill -f "next dev"
# As vezes pkill "npm" pode ser necessário, mas arriscado matar outros npms. 
# O grep above deve pegar o start script.

echo "✅ Serviços encerrados."

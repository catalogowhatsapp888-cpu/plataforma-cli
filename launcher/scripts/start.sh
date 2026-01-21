#!/bin/bash
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH

# Define diretório raiz do projeto (dois níveis acima de launcher/scripts)
PROJECT_ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
cd "$PROJECT_ROOT" || exit

PID_FILE="$PROJECT_ROOT/launcher/pids.json"

# Verifica se já está rodando
# Verifica se já está rodando (DESATIVADO PARA EVITAR TRAVAMENTO EM RESTART)
# if [ -f "$PID_FILE" ]; then
#     echo "⚠️  Processos já iniciados. Pare o aplicativo antes de iniciar novamente."
#     exit 1
# fi

echo "🚀 Iniciando Plataforma..."

# 1. Backend
source "$PROJECT_ROOT/venv/bin/activate"
nohup uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# 2. Ngrok
nohup ngrok http 8000 --domain=flavia-overrash-subacademically.ngrok-free.dev --log=stdout > "$PROJECT_ROOT/ngrok.log" 2>&1 &
NGROK_PID=$!
echo "✅ Ngrok iniciado (PID: $NGROK_PID)"

sleep 3

# 3. Frontend
cd "$PROJECT_ROOT/frontend" || exit
nohup npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"

# 4. Salvar PIDs
echo "{\"backend\": $BACKEND_PID, \"ngrok\": $NGROK_PID, \"frontend\": $FRONTEND_PID, \"status\": \"running\"}" > "$PID_FILE"
echo "🎉 Sistema iniciado com sucesso!"

# Abrir App automaticamente
sleep 2
open "http://localhost:3000"

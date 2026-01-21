#!/bin/bash
export TZ="America/Sao_Paulo"

# Função para matar processos ao sair (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Parando Todos os Serviços..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Iniciando Plataforma Completa (Backend + Frontend + Ngrok)..."
echo "-------------------------------------------------------------"

# 1. Ativar Virtualenv e Iniciar Backend
echo "📦 [Backend] Iniciando na porta 8000..."
source venv/bin/activate
# Rodando uvicorn em background
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo "   -> Backend PID: $BACKEND_PID (Logs em backend.log)"

# 2. Iniciar Ngrok (Tunnel)
echo "🌍 [Ngrok] Iniciando Tunnel na porta 8000..."
# Rodando ngrok em background (sem output barulhento, logs em ngrok.log se precisar)
ngrok http 8000 --domain=flavia-overrash-subacademically.ngrok-free.dev --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!
echo "   -> Ngrok PID: $NGROK_PID"

# 3. Esperar backend subir
echo "⏳ Aguardando Backend iniciar..."
sleep 5

# 4. Iniciar Frontend
echo "🎨 [Frontend] Iniciando na porta 3000..."
cd frontend
# Rodando Next dev em background também para liberar o terminal, 
# mas mostrando output se preferir. 
# Para "tudo em um terminal", vamos deixar o frontend "preso" aqui ou também em background.
# O usuário pediu "único comando", geralmente quer ver o log do frontend ou ficar livre.
# Vou deixar o frontend como processo principal (foreground) para ver erros de compilação.
npm run dev &
FRONTEND_PID=$!
echo "   -> Frontend PID: $FRONTEND_PID"

echo "-------------------------------------------------------------"
echo "✅ TUDO RODANDO!"
echo "   -> Backend: http://localhost:8000"
echo "   -> Frontend: http://localhost:3000"
echo "   -> Ngrok:   https://flavia-overrash-subacademically.ngrok-free.dev"
echo ""
echo "📝 Para ver logs do Backend em tempo real, abra outro terminal e rode: tail -f backend.log"
echo "🛑 Pressione Ctrl+C para encerrar tudo."
echo "-------------------------------------------------------------"

sleep 2
open "http://localhost:3000"

# Espera qualquer processo morrer (mantém script rodando)
wait $FRONTEND_PID $BACKEND_PID $NGROK_PID

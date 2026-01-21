# Versão 1.0 - Estável (MVP Chat Inteligente)
Data: 19/01/2026

## ✅ Funcionalidades Testadas e Aprovadas

### 1. Conectividade (Webhook & Ngrok)
- [x] **Ngrok Autônomo:** Script `iniciar_tudo.sh` levanta o túnel automaticamente.
- [x] **Webhook Robusto:** O backend aceita payloads da Evolution API ignorando diferenças de Case Sensitivity (`messages.upsert` vs `MESSAGES_UPSERT`).
- [x] **Reconexão Inteligente:** Busca contato por telefone com ou sem o 9º dígito (padrão Brasil).

### 2. Gestão de Leads (Kanban)
- [x] **Auto-Criação:** Se chegar mensagem de desconhecido, o sistema cria o Lead e o Card no Kanban automaticamente.
- [x] **Coluna "Responder" (Inbound):** Mensagens recebidas movem o Lead para a coluna vermelha e incrementam contador.
- [x] **Automação "Contactado" (Outbound):** Responder o cliente move o Lead automaticamente para "Contactado".
- [x] **Persistência de Temperatura:** Mudanças de temperatura (Frio/Morno/Quente) são salvas corretamente.

### 3. Chat (Interface)
- [x] **Bolinhas de Notificação:** Contador de mensagens não lidas no cartão do Kanban.
- [x] **Auto-Refresh:** Chat atualiza a cada 3 segundos para mostrar mensagens recebidas.
- [x] **Envio de Mídia:** Suporte (básico) para envio de mensagens/mídia.

---

## 📂 Arquivos Críticos (Não mexer sem backup)
- `iniciar_tudo.sh`: Orquestrador mestre.
- `backend/app/api/v1/endpoints/webhook.py`: Cérebro da recepção de mensagens.
- `backend/app/models/models.py`: Estrutura do banco de dados (SQLite).
- `frontend/app/pipeline/page.tsx`: Lógica visual do Kanban e Chat.

## 🚀 Como Restaurar
Se algo der errado nas próximas atualizações, basta:
1. Descompactar o backup `backup_v1_stable.zip`.
2. Rodar `./iniciar_tudo.sh`.

---
*Gerado por Agente Antigravity*

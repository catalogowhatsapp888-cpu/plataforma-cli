# 🚀 Plataforma Clínica - Versão 1.5 (Work in Progress)
**Status:** Iniciado 🛠️
**Foco:** Inteligência Avançada & Dados

Esta versão transformará o sistema de um "Disparador Inteligente" para um "Agente Especialista".

---

## 📅 Roadmap de Implementação

### 1. Cérebro Especialista (RAG - Retrieval Augmented Generation) 🧠
- [ ] **Upload de Conhecimento:** Permitir que a clínica suba PDFs (Tabela de Preços, Procedimentos, FAQ).
- [ ] **Indexação Vetorial:** O sistema lerá e "decorará" esses documentos.
- [ ] **Consulta Inteligente:** Ao receber uma dúvida (ex: "Quanto custa o Botox?"), a IA consultará o documento antes de responder.
- [ ] **Citações:** A IA saberá *onde* leu a informação.

### 2. Dashboard de Inteligência de Negócio 📊
- [ ] **Funil de Vendas em Tempo Real:** Gráfico de quantos leads estão em cada etapa.
- [ ] **Taxa de Conversão:** % de leads que viraram agendamentos.
- [ ] **Origem dos Leads:** De onde vêm os melhores clientes?
- [ ] **Custo por Conversa:** Estimativa de custos com API.

### 3. Agendamento Inteligente (Agenda) 🗓️
- [ ] **Visualização de Horários:** Calendário inteirado no sistema.
- [ ] **Integração Externa:** Sincronização com Google Calendar (para não agendar em cima de compromissos pessoais).
- [ ] **Agente Agendador:** A IA propõe horários livres reais para o cliente.

---

## 🛠️ Próximos Passos Imediatos
1.  Criar a **Tabela de Conhecimento** no Banco de Dados (para salvar referências aos arquivos).
2.  Criar a interface de **"Treinamento da IA"** em Configurações (Upload de PDFs).
3.  Integrar uma lib de RAG (LangChain ou LlamaIndex simples) no Backend.

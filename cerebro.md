# 🧠 Cérebro — Memória Central do Projeto

> Documento-resumo gerado a partir de **toda a documentação deste repositório**
> (docs de arquitetura, históricos de versão, guias de deploy, backups de prompt e código).
> Serve como referência rápida sobre **quem você é, o que você faz, o que você tem e para onde está indo**.
>
> _Última atualização: 04/06/2026_
>
> ⚠️ Observação honesta: eu (assistente) não tenho acesso ao histórico de chats anteriores —
> cada sessão começa do zero. Este "cérebro" foi reconstruído a partir dos arquivos versionados
> no repositório `plataforma-cli`, que registram boa parte da sua história e contexto.
> Sempre que tivermos novidades, é só me pedir para atualizar este arquivo.

---

## 👤 Quem sou eu

- **Negócio:** Instituto / Clínica de estética da **Dra. Patricia Brandt Scheffer**.
- **Localização:** Rua Bento Gonçalves, 1731 — Sala 111, Centro, Novo Hamburgo/RS, CEP 93510-365.
  - Próximo à Receita Federal. Sem estacionamento próprio (Rotativo Digital NH; rua da Receita é livre).
  - [Google Maps](https://maps.app.goo.gl/SgCi2JSnSjA4fPoz8)
- **Horário de atendimento:** 9h–12h e 13h30–18h (Instituto abre às 8h).
- **Instagram:** [@drapatriciabschefer](https://www.instagram.com/drapatriciabschefer)

### Sobre a Dra. Patricia
- +10 anos em **Biomedicina Estética**. Graduação em Biomedicina (Universidade Feevale).
- Pós em Análises Clínicas e Diagnóstico de Laboratório em Micologia Médica (Universidad Mayor, Santiago-Chile).
- Especialista em Biomedicina Estética (Associação Brasileira de Biomedicina).
- **Diretora Acadêmica da Abrahof**, Speaker do ITC (Balneário Camboriú), embaixadora da Rennova.
- Formação internacional: cursos/eventos em Las Vegas, Mônaco e Congresso Mundial de Medicina Estética (Miami).

### Equipe
| Pessoa | Papel |
|--------|-------|
| **Patricia** | Biomédica e dona do Instituto |
| **Ketlin** | Recepcionista (faz as marcações de horário) |
| **Klaus** | Biomédico adjunto (enzimas corporais, performance, aceleradores metabólicos) |
| **João Valença** | Dentista e professor dos cursos |
| **Mari Beaux** | Farmacêutica e professora dos cursos |

---

## 💼 O que eu faço

Dois modelos de atendimento + formação profissional:

1. **Atendimento Particular** — exclusivamente com a Dra. Patricia (mais privacidade, valor diferenciado).
2. **Paciente Modelo** — atendimentos durante os **cursos** da Dra. Patricia, executados por alunos sob supervisão da Dra. Patricia ou Dr. Klaus. Preços especiais.
3. **Cursos para profissionais** da saúde estética (harmonização facial e procedimentos avançados).

> Marcas usadas (inclusive nos cursos): **Allergan, Galderma, Rennova**.

### Procedimentos realizados
- **Fios de PDO** (sustentação/colágeno; dura 12–18 meses)
- **Toxina botulínica (Botox)** (rugas dinâmicas; dura 3–6 meses)
- **Preenchimentos com ácido hialurônico** (volume/contorno; dura 6 meses a 2 anos)
- **Bioestimuladores de colágeno** (PLLA, hidroxiapatita de cálcio, PCL)
- **Peelings químicos** (renovação da pele, manchas, acne)
- **Enzimas corporais / performance** (com Dr. Klaus): gordura localizada, ganho de massa, aceleradores metabólicos

### Fluxo de atendimento via chat (IA)
- Para falar com a equipe ou **agendar**, o cliente digita **`ATENDENTE`** → a IA direciona para a **Ketlin**.

---

## 🖥️ O que eu tenho (a Plataforma / Sistema)

Uma plataforma SaaS própria — **CRM + automação de WhatsApp com IA** para clínicas de estética.
Nome comercial (white label): **"Superserver"** / "Plataforma Clínica".

### Stack técnico
| Camada | Tecnologia |
|--------|------------|
| **Backend** | Python + **FastAPI** (`backend/`), SQLAlchemy 2.0, Alembic |
| **Frontend** | **Next.js / React** (`frontend/`), TypeScript, middleware de tenant |
| **Banco (atual)** | SQLite (multi-tenant lógico) → migrando para **PostgreSQL/Supabase** |
| **IA** | OpenAI (GPT-4o) + RAG em construção (pypdf) |
| **WhatsApp** | **Evolution API** (webhook `MESSAGES_UPSERT`) |
| **Automação** | **n8n** (execução de disparos) + APScheduler (filas) |
| **Auth** | JWT (passlib/bcrypt, python-jose) → migrando para Supabase Auth |
| **Deploy** | Docker / **Easypanel** em VPS; ngrok/SSH tunnel em dev |
| **Integração externa** | **Clinicorp** (ERP odonto/clínica — credenciais pendentes) |
| **MCP** | `project_mcp.py` (fastmcp) — expõe leads/mensagens para agentes de IA |

### Funcionalidades já entregues
- **CRM Kanban** (estilo Trello): auto-criação de leads, colunas Responder/Contactado/Agendado, temperatura (Frio/Morno/Quente).
- **Chat integrado** ao WhatsApp: webhook robusto (case-insensitive, trata 9º dígito BR), auto-refresh, notificações.
- **Importação de leads** por planilha (.xlsx/.csv) com deduplicação por telefone e normalização E.164.
- **Módulo de Campanhas** (disparo em massa): segmentação dinâmica (regras JSON → SQL), variáveis `{nome}`/`{telefone}`, controle anti-ban (filas, limites/hora, intervalos aleatórios), opt-in/opt-out (LGPD), idempotência via `CampaignEvents`.
- **White Label:** nome, logo (drag & drop), cores, favicon, nicho.
- **IA configurável:** system prompt/personalidade, switch master ON/OFF.
- **Segurança/RBAC:** papéis ADMIN / SUPERVISOR / VENDEDOR / LEITOR, audit logs, multi-tenancy.

### Arquivos críticos (não mexer sem backup)
- `iniciar_tudo.sh` — orquestrador mestre (sobe tudo + túnel).
- `backend/app/api/v1/endpoints/webhook.py` — recepção de mensagens.
- `backend/app/models/models.py` — schema do banco.
- `frontend/app/pipeline/page.tsx` — Kanban + Chat.
- `criar_usuario_admin.py` — recria o admin após deploy limpo.

---

## 📈 Estado atual e histórico de versões

| Versão | Status | Entregas-chave |
|--------|--------|----------------|
| **V1.0** | ✅ Estável (19/01/26) | MVP Chat inteligente, webhook, Kanban com auto-criação |
| **V1.3.0** | ✅ Estável (22/01/26) | White Label "Superserver", import de leads, fix de filas |
| **V1.4** | ✅ Estável (25/01/26) | Fundação CRM + Campanhas + IA + Auth JWT + multi-tenant SQLite |
| **V1.5** | 🛠️ Em andamento | RAG (cérebro especialista), Dashboard BI, Agendamento inteligente |
| **V1.6** | 📐 Planejado | Multi-tenant real no **Supabase/PostgreSQL** + Supabase Auth + RLS |

### Onde estou agora
- Em produção rodando **V1.4/V1.5** via Easypanel.
- Histórico recente de commits focado em **correções de deploy** (dependências, bcrypt, URL do backend hardcoded).
- **V1.6 é o próximo grande salto arquitetural** (já tem plano escrito em `ARQUITETURA_V1.6_MULTITENANT.md`).

---

## 🔮 Próximos passos / Roadmap

### V1.5 — Inteligência Avançada (em andamento)
- [ ] **RAG:** upload de PDFs (tabela de preços, procedimentos, FAQ) → IA responde "Quanto custa o Botox?" com base nos documentos.
- [ ] **Dashboard BI:** funil em tempo real, taxa de conversão, origem de leads, custo por conversa.
- [ ] **Agendamento inteligente:** calendário interno + Google Calendar + agente que propõe horários reais.

### V1.6 — SaaS Multi-tenant (planejado)
- [ ] Migrar SQLite → **PostgreSQL/Supabase** (UUID, JSONB).
- [ ] **Row Level Security (RLS)** — isolamento estrito por `tenant_id`.
- [ ] **Supabase Auth** substituindo JWT manual; trigger `auth.users` → `public.users`.
- [ ] Domínios/subdomínios por cliente (`slug` + `custom_domain`) com middleware no Next.js.
- [ ] Tela de "Setup de Novo Cliente" (cria Tenant + Admin automaticamente).

### Riscos mapeados a vigiar
- **Vazamento entre tenants** (RLS/BOLA mal configurado) → validar sempre que o ID pertence ao tenant logado.
- **Escalonamento de privilégio** → `role` nunca editável no `/me`.
- **Perda de dados na migração** SQLite→Postgres → manter V1.5 rodando em paralelo.
- **Performance** da tabela de mensagens compartilhada → índices compostos `(tenant_id, ...)` e particionamento futuro.

---

## 🔑 Referências rápidas (operacional)

- **Deploy (Easypanel):** backend `Root Directory = /backend`, frontend `/frontend`; volume montado em `/app/dados` para não perder o SQLite; `NEXT_PUBLIC_API_URL` é **Build Argument** (não env).
- **Vars de ambiente principais:** `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `OPENAI_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `CLINICORP_API_KEY`.
- **Webhook Evolution:** apontar para `https://SEU-BACKEND/api/v1/webhook/` com evento `MESSAGES_UPSERT` ativo.
- **Após deploy limpo:** rodar `python criar_usuario_admin.py` no console do backend.
- **Pós-deploy check:** `https://seu-backend.com/docs` (Swagger) deve abrir.

---

_Para atualizar este cérebro, é só me pedir: "atualize o cerebro.md com X". Posso versionar conforme o projeto evolui._

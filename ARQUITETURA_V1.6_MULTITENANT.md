# Arquitetura V1.6: Sistema Multi-Tenant com Supabase

Este documento define o plano de implementação da **Versão 1.6**, com foco em escalabilidade, multi-tenancy e integração com Supabase.

## 1. Visão Geral
A aplicação deixará de ser uma instância isolada (SQLite) para se tornar uma plataforma SaaS centralizada (Supabase PostgreSQL), onde múltiplos clientes (Tenants) coexistem no mesmo banco de dados, mas com isolamento lógico estrito.

## 2. Estrutura de Banco de Dados (Supabase)

### 2.1 Migração para PostgreSQL
O banco SQLite será descontinuado. Todas as tabelas serão recriadas no PostgreSQL do Supabase.

### 2.2 Estratégia de Isolamento (Multi-tenant)
Utilizaremos a estratégia **"Shared Database, Shared Schema, Row Level Security (RLS)"**.
Todas as tabelas críticas terão uma coluna `tenant_id` (UUID). O PostgreSQL garantirá que um cliente jamais veja o dado de outro.

**Tabelas que precisam de `tenant_id`:**
- `users` (Perfil público)
- `tenants` (Empresas)
- `contacts`
- `leads_pipeline` (Adicionar ligação direta para performance)
- `conversations`
- `messages`
- `campaigns`
- `campaign_events` (Adicionar ligação direta)
- `ai_config`
- `knowledge_documents`
- `system_settings`

### 2.3 Supabase Auth (Autenticação)
Substituiremos o sistema de login manual (Python JWT) pelo **Supabase Auth**.

- **Frontend:** Login direto pelo client Supabase.
- **Backend:** O Frontend envia o `access_token` (JWT do Supabase) no header `Authorization`.
- **Validação:** O Backend verifica a assinatura do JWT usando o Segredo do Projeto Supabase.
- **Sincronização:** Quando um usuário é criado no `auth.users` (Supabase), um Trigger (Função SQL) cria automaticamente o registro na tabela `public.users`.

## 3. Fluxo de "Sites" (Client Isolation)

Para que cada cliente pareça estar em um site próprio:
1.  **Domínios:** A tabela `Tenant` terá as colunas `slug` (ex: `clinica-a.app.com`) e `custom_domain` (ex: `app.clinica-a.com`).
2.  **Identificação:** No Frontend/Next.js, um Middleware detectará o domínio/subdomínio e injetará o `tenant_id` no contexto da requisição.

## 4. Plano de Execução

### Fase 1: Preparação do Schema (Local -> Cloud)
1.  Adaptar modelos SQLAlchemy para PostgreSQL (`UUID` nativo, `JSONB`).
2.  Criar script de migração de dados (SQLite -> Supabase).
3.  Implementar políticas RLS (Row Level Security) no Supabase.

### Fase 2: Autenticação Híbrida
1.  Configurar Supabase Auth no Frontend.
2.  Atualizar `deps.py` no Backend para aceitar tokens do Supabase.
3.  Vincular `auth.users` com `public.users` via `id`.

### Fase 3: Refatoração de Queries
1.  Garantir que TODAS as queries do backend filtrem por `tenant_id` (Automação via Session ou filtro explícito).
2.  Adicionar índices compostos `(tenant_id, ...)` para performance.

### Fase 4: Frontend Dinâmico
1.  Ajustar o `layout.tsx` para carregar tema/logo baseado no Tenant autenticado.
2.  Criar tela de "Setup de Novo Cliente" (criação automática de Tenant e Admin).

## 5. Riscos e Mitigações
- **Vazamento de Dados:** RLS mal configurado. *Solução:* Testes unitários focados em segurança.
- **Performance:** Tabela gigante de mensagens compartilhada. *Solução:* Particionamento (Partitioning) no Postgres futuro.
- **Migração:** Perda de dados na conversão SQLite. *Solução:* Manter V1.5 rodando enquanto V1.6 é construída em paralelo.

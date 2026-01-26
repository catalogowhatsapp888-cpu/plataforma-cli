# Arquitetura V1.4 - Gestão de Usuários e Segurança

## 1. Modelo Lógico de Dados (Multi-tenant)

### Entidades Principais

| Tabela | Descrição | Campos Chave |
|--------|-----------|--------------|
| **`tenants`** | Representa a Empresa/Cliente. | `id` (UUID), `name`, `document_id` (CNPJ), `status`, `plan_tier` |
| **`users`** | Usuários do sistema. | `id` (UUID), `tenant_id` (FK), `email` (Unique per Tenant), `password_hash`, `role`, `is_active` |
| **`audit_logs`** | Registro imutável de ações. | `id`, `tenant_id`, `user_id`, `action`, `resource`, `ip_address`, `timestamp`, `details` (JSON) |

### Relacionamentos e Isolamento
- **Regra de Ouro:** Toda tabela de negócio (Leads, Mensagens, Campanhas) DEVE ter uma coluna `tenant_id`.
- **Query Filter:** O sistema deve injetar automaticamente `WHERE tenant_id = current_user.tenant_id` em todas as consultas.

## 2. Controle de Permissões (RBAC)

Estrutura hierárquica de papéis:

| Papel (Role) | Descrição | Permissões Típicas |
|--------------|-----------|--------------------|
| **ADMIN** | Dono da conta. | Acesso total (Criar usuários, Ver logs, Configurar sistema, Billing). |
| **SUPERVISOR** | Gestor de equipe. | Ver todos os leads, Ver relatórios, Não acessa Configurações/Billing. |
| **VENDEDOR** | Operacional. | Ver apenas *seus* leads (ou distribuídos), Atender chat. Sem acesso a exclusão em massa. |
| **LEITOR** | Apenas visualização. | Ver dashboards e relatórios. Apenas leitura. |

### Matriz de Acesso (Exemplo)

| Recurso / Ação | ADMIN | SUPERVISOR | VENDEDOR |
|----------------|-------|------------|----------|
| **Configurações Globais** | ✅ | ❌ | ❌ |
| **Gestão de Usuários** | ✅ | ❌ | ❌ |
| **Campanhas (Criar)** | ✅ | ✅ | ❌ |
| **Leads (Ver Todos)** | ✅ | ✅ | ❌ (Apenas próprios) |
| **Exportar Dados** | ✅ | ❌ | ❌ |

## 3. Fluxos de Autenticação e Segurança

### Fluxo de Login (JWT)
1. **Request:** `POST /api/v1/auth/login` (email, password)
2. **Backend:**
   - Busca usuário pelo email.
   - Verifica hash da senha (`bcrypt` ou `argon2`).
   - Valida se `user.is_active` e `tenant.is_active`.
3. **Token Generation:**
   - Cria **Access Token** (JWT) com validade curta (ex: 15min). Payload: `{sub: user_id, tenant: tenant_id, role: role}`.
   - Cria **Refresh Token** (armazenado no banco com hash) com validade longa (ex: 7 dias).
4. **Response:** Retorna tokens.

### Middleware de Segurança (Proteção de Rotas)
Para cada requisição protegida:
1. **Extração:** Ler Token Bearer do Header.
2. **Validação JWT:** Verificar assinatura e expiração.
3. **Contexto:** Injetar `current_user` e `current_tenant` no contexto da requisição.
4. **Autorização (RBAC):** Verificar se `current_user.role` tem permissão para o recurso solicitado.
5. **Log:** Se for ação de escrita/crítica, gravar entrada em `audit_logs`.

## 4. Boas Práticas e Compliance (LGPD)

### Proteção de Dados
- **Senhas:** Nunca armazenar em texto plano. Usar passlib com `bcrypt`.
- **Dados Sensíveis:** Telefones e Emails de leads devem ser tratados com cuidado.
- **HTTPS:** Obrigatório para tráfego de tokens.

### Auditoria (Audit Log)
Deve ser "Append Only" (nunca editar ou excluir logs).
Campos obrigatórios:
- **Quem:** `user_id`, `email`
- **Onde:** `resource` (ex: /api/v1/users/123)
- **O que:** `action` (ex: UPDATE_ROLE)
- **Origem:** `ip_address`, `user_agent`

## 5. Alertas de Risco ⚠️

1. **Broken Object Level Authorization (BOLA):** Ocorre quando um usuário altera o ID na URL para acessar dados de outro tenant.
   - *Solução:* SEMPRE validar se o ID solicitado pertence ao `tenant_id` do usuário logado.
2. **Privilege Escalation:** Um usuário tenta alterar seu próprio role via API.
   - *Solução:* O campo `role` não deve ser editável no endpoint de update de perfil (`/me`). Apenas no endpoint de gestão de usuários (`/admin/users`).
3. **Vazamento de Dados em Logs:** Logar o corpo da requisição pode expor senhas.
   - *Solução:* Sanitizar logs para remover campos como `password`, `token`, `secret`.

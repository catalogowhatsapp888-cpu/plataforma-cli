# Planejamento Versão 1.4.0 (Em Desenvolvimento)
Início: 23/01/2026
Baseada na Stable V1.3

## 🎯 Objetivo da Versão
Implementar um sistema robusto de **Gestão de Usuários e Segurança Multi-tenant** (SaaS B2B), garantindo isolamento de dados, controle de acesso baseado em função (RBAC) e conformidade com LGPD.

## 📋 RoadMap Prioritário

### 1. Arquitetura de Dados & Segurança 🔒
- [ ] **Modelagem de Dados:** Criar tabelas `Tenant`, `User`, `Role`, `AuditLog`.
- [ ] **Isolamento:** Garantir que todas as queries filtrem pelo `tenant_id`.
- [ ] **Criptografia:** Implementar hash de senha (bcrypt/argon2) e criptografia de dados sensíveis.

### 2. Autenticação & Autorização 🔑
- [ ] **Auth System:** Login via JWT (Access + Refresh Token).
- [ ] **Middleware:** Interceptador para validar `tenant_id` e Permissões (RBAC) em cada request.
- [ ] **RBAC:** Implementar papéis (ADMIN, SUPERVISOR, VENDEDOR).

### 3. Gestão de Usuários (Back-end) 👥
- [ ] **CRUD Usuários:** Endpoints para criar, listar, editar e desativar usuários.
- [ ] **Convites:** Sistema de convite por email (opcional na v1).
- [ ] **Logs de Auditoria:** Registrar ações críticas (quem, o quê, quando).

### 4. Interface Administrativa (Front-end) 🖥️
- [ ] **Novo Menu:** "Empresa e Usuários" (Visível apenas para ADMIN).
- [ ] **Gestão de Equipe:** Tela para listar e editar membros da equipe.
- [ ] **Restrição de Menus:** Ocultar "Configurações" e "Empresa" para não-admins.

## 🛠 Histórico de Mudanças
| Data       | Tipo        | Descrição |
|------------|-------------|-----------|
| 23/01/2026 | Milestone   | Início da V1.4 (Foco em Segurança e Multi-tenant) |

---
*Este arquivo documenta o progresso da versão atual.*

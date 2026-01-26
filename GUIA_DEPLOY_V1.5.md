# Guia de Implantação V1.5 (Easypanel & VPS)

Este guia detalha como subir a **Versão 1.5** (Tag `v1.5` do GitHub) no seu Easypanel.

## Pré-requisitos
- Repositório GitHub conectado ao Easypanel (já feito).
- Repositório atualizado (`main` ou `v1.5`).

---

## 1. Serviço: Backend (`plataforma-cliente`)

Este serviço roda a API Python.

### Configurações de Build (Source)
- **Git Repository:** `sua-org/plataforma-cli` (Github conectado)
- **Branch/Tag:** `v1.5` ou `main`
- **Root Directory:** `/backend`  ⚠️ (Muito Importante: se deixar vazio, o build falha)
- **Build Type:** Dockerfile
- **Dockerfile Path:** `Dockerfile` (O padrão já serve)

### Ambiente (Environment)
Adicione as variáveis no Easypanel:

| Chave | Valor (Exemplo) | Notas |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:////app/dados/clinica.db` | Para persistência |
| `PROJECT_NAME` | `Plataforma Clínica` | Nome qualquer |
| `SECRET_KEY` | `gere_uma_chave_segura_aqui` | Para segurança do login |
| `CORS_ORIGINS` | `https://seu-site-frontend.com` | URL do seu front |
| `OPENAI_API_KEY` | `sk-...` | Sua chave OpenAI |
| `EVOLUTION_API_URL` | `https://evolution.seu-site.com` | Sua Evolution |
| `EVOLUTION_API_KEY` | `...` | Sua Global Key |
| `EVOLUTION_INSTANCE`| `agencia_ia` | Nome da instância |

### Persistência (Volumes) 💾
Para não perder o banco de dados a cada deploy, você **tem** que montar um volume.
1. Vá na aba **Mounts** (ou Volumes).
2. Adicione um novo mount:
   - **Type:** Disk (Volume)
   - **Mount Path:** `/app/dados`
   - **Name:** `sqlite-data` (qualquer nome)

Isso garante que o arquivo `clinica.db` seja salvo no disco do servidor.

---

## 2. Serviço: Frontend (`plataforma-web`)

Este serviço roda o painel Next.js.

### Configurações de Build (Source)
- **Root Directory:** `/frontend` ⚠️
- **Build Type:** Dockerfile

### Build Arguments 🏗️ (Atenção!)
O Next.js precisa saber a URL do backend **durante o build**.
Vá na aba **Build** > **Build Arguments** (não é Environment Variables):

| Chave | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://plataforma-cliente.seudominio.com` | URL pública do backend |

### Ambiente (Environment)
Para execução (runtime):

| Chave | Valor |
| :--- | :--- |
| `NODE_ENV` | `production` | (Geralmente automático) |

---

## 3. Checklist Pós-Deploy

1. **Backend:** Acesse `https://seu-backend.com/docs`. Se abrir o Swagger, está online.
   - Use o endpoint `/api/v1/auth/login` no Swagger para testar.
   - O primeiro deploy vai criar o DB vazio. Você precisa recriar o usuário admin.
   
2. **Criar Admin:**
   - No Easypanel, abra o **Console** do backend.
   - Execute: `python criar_usuario_admin.py` (certifique-se que este script está na pasta `/app`. Se não estiver, copie o conteúdo e rode).
   - *Nota:* O Dockerfile copia tudo, então o script deve estar lá.
   
3. **Frontend:** Acesse o site. Tente logar com admin/admin (ou o que criou).

## Dicas da Versão 1.5
- **Evolution:** Se precisar atualizar a URL/Key depois, use o novo painel em **Configurações > Evolution API**.
- **Segurança:** O frontend agora pede a senha de admin para alterar configurações críticas.

# PASSO A PASSO DETALHADO: Easypanel

Se você está tendo dificuldades, siga estes passos exatos. NÃO pule nenhum detalhe.

## PASSO 1: Preparar o Backend (API)
Crie um serviço do tipo **App** no Easypanel. Nomeie como: `plataforma-cliente`

1.  **Aba "Source" (Origem):**
    *   **Repository:** Selecione seu GitHub (`plataforma-cli`).
    *   **Branch:** Selecione `main` ou `v1.5`.
    *   **Build Type:** Dockerfile
    *   **Root Directory:** `/backend`  ⬅️ **(MUITO IMPORTANTE: Se esquecer a barra ou escrever errado, falha)**.

2.  **Aba "Environment" (Variáveis):**
    Adicione estas variáveis de ambiente:
    *   `DATABASE_URL` = `sqlite:////app/dados/clinica.db`
    *   `SECRET_KEY` = `invente_uma_senha_dificil`
    *   `PROJECT_NAME` = `Plataforma Clinica`
    (Adicione as chaves da Evolution / OpenAI se já tiver, caso contrário adicione depois).

3.  **Aba "Storage" (ou Mounts):**
    *   Clique em "Add Mount".
    *   **Type:** Volume (Disk)
    *   **Mount Path:** `/app/dados`
    *   **Name:** `db_data` (ou qualquer nome).
    *   *Sem isso, você perde os usuários toda vez que reiniciar.*

4.  **Aba "Domains" (Domínios):**
    *   Adicione um domínio, ex: `api.seudominio.com`.
    *   Habilite HTTPS (o Easypanel faz sozinho).

5.  **Ação:** Clique em **Deploy** (ou Save & Deploy).
    *   Espere ficar verde (Running).
    *   Acesse `https://api.seudominio.com/docs`. Se abrir o Swagger, o Backend está VIVO. ✅

---

## PASSO 2: Preparar o Frontend (Site)
Crie OUTRO serviço do tipo **App**. Nomeie como: `plataforma-web`

1.  **Aba "Source":**
    *   **Repository:** Mesmo GitHub.
    *   **Root Directory:** `/frontend` ⬅️ **(CRÍTICO: aponta para a pasta do site)**.
    *   **Build Type:** Dockerfile

2.  **Aba "Build" (Sub-aba Build Arguments):**
    *(Não confundir com Environment Variables comum! Procure onde diz "Build Args")*
    *   Adicione `NEXT_PUBLIC_API_URL` = `https://api.seudominio.com` (Use o domínio que criou no Passo 1).
    *   *Isso "imprime" o endereço da API no código do site.*

3.  **Aba "Environment" (Runtime):**
    Adicione:
    *   `BACKEND_URL` = `http://plataforma-cliente:8000`
        *   *(Explicação: `plataforma-cliente` é o nome do serviço backend que você criou. O Easypanel cria uma rede interna. Isso permite que o servidor do site converse com o servidor da API).*
        *   *Se você nomeou o backend diferente, use o nome exato dele.*

4.  **Aba "Domains":**
    *   Adicione o domínio do site, ex: `app.seudominio.com` (ou `crm.seudominio.com`).
    *   HTTPS On.

5.  **Ação:** Deploy.

---

## PASSO 3: Configuração Final (Admin)
Se tudo subiu (luzes verdes), ainda falta criar o usuário, pois o banco é novo.

1.  No Easypanel, clique no serviço **Backend (`plataforma-cliente`)**.
2.  Vá na aba **Console**.
3.  Clique em **Connect**.
4.  Digite: `python criar_usuario_admin.py`
5.  Ele vai confirmar: "Admin criado: admin@admin.com / 123456".

Agora acesse seu site (`app.seudominio.com`) e faça login! 🎉

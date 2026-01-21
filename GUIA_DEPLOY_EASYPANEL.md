# 🚀 Guia de Deploy - Hostinger Easypanel (V1.3)

Este guia explica como transformar seu projeto local em um site acessível via web.

## Pré-requisitos
1.  **VPS Hostinger** com Easypanel instalado (Template Ubuntu com Docker/Easypanel).
2.  **Repositório Git:** O código deve estar no GitHub/GitLab (Privado ou Público).

---

## Passo 1: Preparar Repositório Git
Como o código está no Google Drive, precisamos enviá-lo para um Git.
1.  Crie um repositório no GitHub (ex: `plataforma-clinica`).
2.  No seu  terminal, dentro da pasta do projeto:
    ```bash
    git init
    git add .
    git commit -m "Deploy V1.3"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/plataforma-clinica.git
    git push -u origin main
    ```

---

## Passo 2: Configurar Easypanel

Acesse seu painel (geralmente `http://IP_DA_VPS:3000`).

### Serviço 1: Backend (API & Banco)
1.  **Create Service** -> **App**.
2.  **Source:** Github. Escolha o repo.
3.  **Build Settings:**
    *   **Context Directory:** `/backend` (Muito importante!)
    *   **Dockerfile Path:** `Dockerfile` (padrão)
4.  **Environment Variables:**
    *   `DATABASE_URL`: `sqlite:////app/dados/clinica.db`
    *   `OPENAI_API_KEY`: `sk-...`
    *   `EVOLUTION_API_URL`: `https://sua-evolution.com` (ou ip)
    *   `EVOLUTION_API_KEY`: `...`
5.  **Volumes (Persistência):**
    *   Vá em "Mounts".
    *   New Mount -> Type: Volume.
    *   Mount Path: `/app/dados`
    *   Isso garante que o `clinica.db` não suma a cada deploy.
6.  **Network:**
    *   Porta: `8000`.
    *   Domain: `api-clinica.seudominio.com` (ou gere um domínio grátis do easypanel).

### Serviço 2: Frontend (Site)
1.  **Create Service** -> **App**.
2.  **Source:** Mesmo repo.
3.  **Build Settings:**
    *   **Context Directory:** `/frontend`
    *   **Dockerfile Path:** `Dockerfile`
    *   **Build Arguments:**
        *   `NEXT_PUBLIC_API_URL`: `https://api-clinica.seudominio.com` (A URL que você criou no passo anterior).
4.  **Network:**
    *   Porta: `3000`.
    *   Domain: `clinica.seudominio.com`.

### Serviço 3: Evolution API (Se for hospedar junto)
Recomenda-se usar o template "Evolution API" se disponível no Easypanel, ou criar via Docker Image `atendai/evolution-api:latest`.
*   Precisa de Redis (crie um serviço Redis antes).

---

## Passo 3: Acesse!
Após o deploy (pode levar uns 5-10 minutos na primeira vez), acesse o domínio do Frontend (`clinica.seudominio...`).

Tudo deve funcionar magicamente! ✨

# 🚀 Guia Rápido: MCP e Webhook WhatsApp

Este guia explica como ativar o **Servidor MCP** (para usar com IA/Claude Desktop) e como funciona o **Webhook de Mensagens** (para receber do cliente).

---

## 1. Servidor MCP (Acesso via IA)

O arquivo `project_mcp.py` permite que agentes de IA (como o Claude Desktop) acessem seus leads e enviem mensagens.

### Passos para ativar:

1.  **Instalar a dependência:**
    No terminal (dentro da pasta do projeto, com venv ativado):
    ```bash
    pip install fastmcp uvicorn
    ```
    *(Eu já iniciei essa instalação para você via chat).*

2.  **Testar o servidor (Modo Dev):**
    ```bash
    fastmcp dev project_mcp.py
    ```
    Isso abrirá um inspetor no navegador para você testar as ferramentas.

3.  **Configurar no Claude Desktop (Opcional):**
    Adicione ao seu `claude_desktop_config.json`:
    ```json
    {
      "mcpServers": {
        "plataforma-clinica": {
          "command": "/caminho/completo/para/seu/venv/bin/python",
          "args": ["-m", "fastmcp", "run", "project_mcp.py"]
        }
      }
    }
    ```
    *(Troque o caminho para o path absoluto do seu python no venv).*

---

## 2. Webhook (Recebimento de Mensagens)

Criamos o endpoint `POST /api/v1/webhook/` que recebe mensagens da Evolution API e salva no banco de dados local.

### Como funciona:
1.  O cliente envia mensagem no WhatsApp.
2.  A Evolution API notifica seu backend neste endpoint.
3.  O sistema salva na tabela `messages`.
4.  O Chat no frontend exibe a mensagem (atualize ou reabra o modal se necessário).

### Configuração na Evolution API:
Certifique-se que sua instância na Evolution API tem o webhook configurado para apontar para o seu servidor.
*   **URL:** `http://SEU_IP_OU_NGROK:8000/api/v1/webhook/` (Localhost não funciona se a Evolution estiver em container externo, use `host.docker.internal` ou `ngrok`).
*   **Eventos:** Marque `MESSAGES_UPSERT`.
*   **Habilitado:** Sim.

### Teste de Recebimento (Simulado):
Se quiser testar sem depender da Evolution agora, rode:
```bash
./venv/bin/python teste_recebimento_msg.py
```
Se der "SUCESSO", vá ao navegador e veja se a mensagem apareceu no chat do cliente.

---

> **⚠️ IMPORTANTE:**
> Como criamos novos arquivos no Backend, você precisa **REINICIAR O SERVIDOR** (`iniciar_tudo.sh`) para que o Webhook funcione.

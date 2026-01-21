# Arquitetura do Módulo de Campanhas e Segmentação Dinâmica

## 1. Visão Geral da Arquitetura (Antigravity + n8n)

O sistema funcionará como o "Cérebro" (Decisão) e o n8n como o "Músculo" (Execução).

```mermaid
graph TD
    A[Frontend: Construtor de Público] -->|Salva Regras JSON| B(Banco de Dados: Tabela Campaigns)
    C[Admin] -->|Ativa Campanha| D[API Backend: /campaigns/{id}/execute]
    D -->|1. Lê Regras JSON| E{Campaign Engine}
    E -->|2. Traduz JSON p/ SQL| F[(Postgres/SQLite)]
    F -->|3. Retorna Lista de Contatos| E
    E -->|4. Loop na Lista| G[Fila de Disparo Interna]
    G -->|5. Post Individual| H[Webhook n8n]
    H -->|6. Fluxo de Automação| I[WhatsApp/Email]
```

---

## 2. Estrutura de Dados Recomendada

### A. Tabela `Campaigns`
Armazena a definição da campanha.
- `id`: UUID
- `name`: String
- `status`: Enum (draft, active, scheduled, completed)
- `audience_rules`: JSON (O payload de regras)
- `schedule_at`: DateTime (Opcional)

### B. Tabela `CampaignEvents` (Log de execução)
Preveni disparos duplicados e gera relatórios.
- `id`: UUID
- `campaign_id`: FK
- `contact_id`: FK
- `status`: Enum (sent, delivered, failed)
- `processed_at`: DateTime

### C. Campos Necessários no `Contact`
Para suportar a segmentação pedida:
- `is_active`: Boolean (Adicionar este campo)
- `lead_pipeline.temperature`: Já existe.
- `procedures.performed_at`: Já existe (Tabela Procedure).

---

## 3. Lógica de Resolução de Regras (Python/SQLAlchemy)

O Backend deve ter um **Parser** que traduz o JSON em filtros do SQLAlchemy dinamicamente.

**Pseudocódigo do Parser:**

```python
def parse_rules(audience_rules, base_query):
    logic = audience_rules.get('logic', 'AND')
    conditions = audience_rules.get('conditions', [])
    
    filters = []
    
    for rule in conditions:
        field = rule['field']
        op = rule['operator']
        val = resolve_relative_dates(rule['value']) # Ex: NOW-90DAYS -> datetime
        
        column = get_column_mapping(field) # Mapeia string 'temperature' -> LeadPipeline.temperature
        
        if op == 'equals':
            filters.append(column == val)
        elif op == 'not_equals':
            filters.append(column != val)
        elif op == 'in':
            filters.append(column.in_(val))
        elif op == 'before':
            filters.append(column < val)
        elif op == 'after':
            filters.append(column > val)

    if logic == 'AND':
        return base_query.filter(and_(*filters))
    elif logic == 'OR':
        return base_query.filter(or_(*filters))
```

---

## 4. Contrato API

### Endpoint de Preview (Validação em Tempo Real)
`POST /api/v1/campaigns/preview_audience`
**Body:** Payload das regras JSON.
**Response:**
```json
{
    "count": 142,
    "sample": ["Maria Silva", "João Santos", "Ana Paula"] # Primeiros 3 nomes
}
```

### Endpoint de Disparo
`POST /api/v1/campaigns/{id}/execute`
Este endpoint:
1. Busca a campanha no banco.
2. Resolve a audiência.
3. Filtra quem JÁ recebeu esta campanha (usando `CampaignEvents`).
4. Envia para o n8n.

---

## 5. Boas Práticas (LGPD e Segurança)

1.  **Opt-in/Opt-out Obrigatório:**
    *   Todo disparo deve verificar `Contact.opt_in == True`.
    *   Se `opt_in` for False, o `Campaign Engine` DEVE excluir silenciosamente da lista.
2.  **Idempotência:**
    *   Antes de enviar para o n8n, verificar se o par `(campaign_id, contact_id)` já existe na tabela de eventos.
3.  **Throttling (Controle de Fluxo):**
    *   Não enviar 1000 webhooks para o n8n simultaneamente.
    *   Usar `BackgroundTasks` do FastAPI para processar em lotes (ex: 50 por minuto) ou um Worker (Celery/Redis) se escalar.
4.  **Sanitização:**
    *   Certificar que telefones estão no formato E.164 antes do envio.

## 6. Sugestão de UX (Frontend)

1.  **Bloco de Condições:**
    *   Dropdown "Campo" (Temperatura, Último Procedimento).
    *   Dropdown "Operador" (Muda conforme o tipo de campo. Ex: Datas mostram "Antes de", Textos mostram "Igual a").
    *   Input "Valor" (Dropdown para enums, Datepicker para datas).
2.  **Contador Flutuante:**
    *   Um componente "Sticky" na tela que mostra: "Público Alvo: Calculando..." -> "Público Alvo: 45 clientes".
    *   Atualiza via *debounce* (espera usuário parar de digitar por 500ms para chamar a API de preview).

---
*Planejamento Baseado na Versão 1.1.0*

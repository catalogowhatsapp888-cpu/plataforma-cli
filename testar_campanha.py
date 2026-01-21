import requests
import json

API_URL = "http://localhost:8000/api/v1/campaigns/preview"

def test_audience(name, rules):
    print(f"\n--- Testando Regra: {name} ---")
    payload = {
        "audience_rules": rules
    }
    
    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! Encontrados: {data['count']} de {data['total_leads']}")
            print(f"⏱️ Tempo: {data['query_time_ms']:.2f}ms")
            if data['count'] > 0:
                print("👥 Amostra:")
                for c in data['sample']:
                    print(f"  - {c['full_name']} ({c['phone']}) [Temp: {c['temperature']}]")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Falha na conexão: {e}")

if __name__ == "__main__":
    # Teste 1: Todos os Leads Quentes
    test_audience("Leads Quentes", {
        "logic": "AND",
        "conditions": [
            {
                "field": "temperature",
                "operator": "equals",
                "value": "quente"
            }
        ]
    })

    # Teste 2: Estágio Novo OU Não Lido
    test_audience("Novos ou Responder", {
        "logic": "OR",
        "conditions": [
            {
                "field": "stage",
                "operator": "equals",
                "value": "novo"
            },
            {
                "field": "stage",
                "operator": "equals",
                "value": "nao_lido"
            }
        ]
    })
    
    # Teste 3: Filtro Impossível (Teste Zero)
    test_audience("Filtro Impossível", {
        "logic": "AND",
        "conditions": [
            {
                "field": "temperature",
                "operator": "equals",
                "value": "nuclear"
            }
        ]
    })

import requests
import sys

BASE_URL = "http://localhost:8000/api/v1/campaigns"

def test_execute():
    # 1. Listar
    print("Listando campanhas...")
    r = requests.get(f"{BASE_URL}/")
    if r.status_code != 200:
        print(f"Erro ao listar: {r.text}")
        return

    campaigns = r.json()
    if not campaigns:
        print("Nenhuma campanha encontrada para testar.")
        return

    campaign_id = campaigns[0]['id']
    name = campaigns[0]['name']
    print(f"Testando disparo para campanha: {name} ({campaign_id})")

    # 2. Executar
    url = f"{BASE_URL}/{campaign_id}/execute"
    print(f"POST {url}")
    
    r = requests.post(url)
    
    if r.status_code == 200:
        print("✅ Sucesso!")
        print(r.json())
    else:
        print(f"❌ Erro {r.status_code}: {r.text}")

if __name__ == "__main__":
    test_execute()

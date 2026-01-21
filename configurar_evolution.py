import requests

# Ajuste manual se não conseguir carregar settings
API_URL = "https://evolution.superserver.com.br"
API_KEY = "EB27C50B6104-4AAD-9AFD-70DFA5268179"
INSTANCE = "agenciaia"

headers = {
    "apikey": API_KEY,
    "Content-Type": "application/json"
}

def check_settings():
    print(f"📦 Verificando configurações da instância: {INSTANCE}")
    
    # Endpoint de Settings da Evolution v2 (pode variar dependendo da versão, vou tentar v2)
    url = f"{API_URL}/instance/fetchInstances" # Lista todas para ver se achamos algo
    # Ou tentar settings direto
    
    # Vamos tentar habilitar storeMessages direto
    url_settings = f"{API_URL}/instance/set/{INSTANCE}"
    # Na v2 comum, é /settings/set/:instance
    # Vou tentar o endpoint de update de comportamento
    
    # Tentativa 1: Settings
    url_v2 = f"{API_URL}/settings/find/{INSTANCE}"
    
    try:
        resp = requests.get(url_v2, headers=headers)
        if resp.status_code == 200:
            print(f"⚙️ Config Atual: {resp.json()}")
        else:
            print(f"⚠️ Erro ao ler configs: {resp.status_code} {resp.text}")
            
    except Exception as e:
        print(f"Erro conexao: {e}")

def configure_webhook():
    print("🔧 Configurando Webhook na Evolution (Forçado)...")
    
    # URL DO NGROK (Atualizada)
    WEBHOOK_URL = "https://flavia-overrash-subacademically.ngrok-free.app/api/v1/webhook/"
    
    payload = {
        "webhook": {
            "enabled": True,
            "url": WEBHOOK_URL,
            "events": [
                "MESSAGES_UPSERT"
            ]
        }
    }
    
    # URL CORRETA DA V2: /webhook/set/:instance
    # Ou /webhook/instance/:instance dependendo da versão
    urls_to_try = [
        f"{API_URL}/webhook/set/{INSTANCE}",
        f"{API_URL}/webhook/instance/{INSTANCE}",
        f"{API_URL}/instance/set/{INSTANCE}" # Fallback
    ]
    
    success = False
    for url in urls_to_try:
        try:
            print(f"📡 Tentando POST em {url}...")
            resp = requests.post(url, json=payload, headers=headers)
            print(f"Status: {resp.status_code}")
            
            if resp.status_code == 200 or resp.status_code == 201:
                print(f"✅ SUCESSO! Webhook configurado em: {WEBHOOK_URL}")
                # Verifica se retornou config
                print(f"Resposta: {resp.json()}")
                success = True
                break
            else:
                print(f"Falha: {resp.text}")
        except Exception as e:
            print(f"Erro conexao: {e}")
            
    if not success:
        print("❌ Não foi possível configurar o webhook via API.")

if __name__ == "__main__":
    check_settings()
    configure_webhook()

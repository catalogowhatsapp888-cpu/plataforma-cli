import sys
import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente manualmente para o script
load_dotenv()

# Adiciona o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.clinicorp_service import clinicorp_service
from app.core.config import settings

def testar_conexao():
    print("🏥 Teste de Integração Clinicorp")
    print("--------------------------------")
    
    api_key = settings.CLINICORP_API_KEY
    if not api_key:
        print("❌ ERRO: Chave de API não encontrada no arquivo .env")
        print("👉 Abra o arquivo .env e preencha CLINICORP_API_KEY=sua_chave_aqui")
        return

    print(f"🔑 Chave detectada: {api_key[:5]}...{api_key[-5:]}")
    print(f"🌐 Base URL: {settings.CLINICORP_API_URL}")
    print("\n🔄 Tentando listar pacientes...")

    resultado = clinicorp_service.list_patients()
    
    if "error" in resultado:
        print(f"\n❌ Falha na conexão: {resultado['error']}")
    elif "mock" in resultado:
        print("\n⚠️  Atenção: O sistema está rodando em modo Mock (Simulação). Verifique se a chave foi salva corretamente.")
    else:
        print("\n✅ SUCESSO! Conexão estabelecida.")
        print(f"📄 Resposta da API: {str(resultado)[:200]}...") # Mostra o começo da resposta

if __name__ == "__main__":
    testar_conexao()

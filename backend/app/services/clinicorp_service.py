import requests
from typing import Dict, Any, Optional
from app.core.config import settings

class ClinicorpService:
    def __init__(self):
        self.api_key = settings.CLINICORP_API_KEY
        self.base_url = settings.CLINICORP_API_URL

    def _get_headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise ValueError("Clinicorp API Key not configured")
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def get_patient(self, patient_id: str) -> Dict[str, Any]:
        """
        Busca dados de um paciente pelo ID.
        """
        if not self.api_key or not self.base_url:
             # Retorno Mockado para desenvolvimento sem credenciais
            return {
                "id": patient_id,
                "name": "Paciente Teste Mock",
                "email": "teste@exemplo.com",
                "phone": "+5511999999999",
                "mock": True
            }

        try:
            url = f"{self.base_url}/patients/{patient_id}"
            response = requests.get(url, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Erro ao consultar Clinicorp: {e}")
            return {"error": str(e)}

    def list_patients(self, limit: int = 10) -> Dict[str, Any]:
        """
        Lista pacientes (para teste de integração).
        """
        if not self.api_key:
            return {"mock": True, "data": []}

        # Tenta endpoints comuns (English e PT-BR)
        endpoints = ["/patients", "/pacientes"]
        
        last_error = None
        
        for endpoint in endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                print(f"Tentando conectar em: {url}")
                response = requests.get(url, headers=self._get_headers(), params={"limit": limit})
                if response.status_code == 200:
                     return response.json()
            except requests.RequestException as e:
                last_error = e
                print(f"Falha em {endpoint}: {e}")
                
        return {"error": f"Não foi possível listar pacientes. Último erro: {last_error}"}

    def list_appointments(self, date_from: str, date_to: str) -> Dict[str, Any]:
        """
        Lista agendamentos em um período.
        """
        if not self.api_key or not self.base_url:
            return {
                "data": [
                    {"id": "1", "patient_id": "100", "date": "2026-01-20T10:00:00", "status": "confirmed"}
                ],
                "mock": True
            }
            
        try:
            url = f"{self.base_url}/appointments"
            params = {"start": date_from, "end": date_to}
            response = requests.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Erro ao listar agendamentos: {e}")
            return {"error": str(e)}

clinicorp_service = ClinicorpService()

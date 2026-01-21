import requests
from typing import Dict, Any, Optional
from app.core.config import settings

class EvolutionService:
    def __init__(self):
        self.base_url = settings.EVOLUTION_API_URL
        self.api_key = settings.EVOLUTION_API_KEY
        self.instance = settings.EVOLUTION_INSTANCE_NAME

    def _get_headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise ValueError("Evolution API Key not configured")
        return {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    def send_message(self, phone: str, text: str, media_url: Optional[str] = None, delay: int = 1200) -> Dict[str, Any]:
        """
        Envia uma mensagem (Texto ou Mídia).
        Allow custom typing delay (in ms).
        """
        if not self.base_url or not self.api_key:
            print("⚠️ Evolution API não configurada. Mensagem não enviada.")
            return {"mock": True, "status": "simulated"}

        import re
        numbers = re.sub(r'\D', '', phone)
        
        # Decide endpoint baseado se tem mídia ou não
        if media_url:
            media_content = media_url

            # Se for URL local (localhost), converter para Base64
            # Isso resolve o problema da Evolution (Docker) não acessar localhost do host
            if "localhost:8000/static/uploads/" in media_url or "127.0.0.1:8000/static/uploads/" in media_url:
                try:
                    import base64
                    import os
                    import mimetypes
                    
                    filename = media_url.split("/")[-1]
                    # Caminho absoluto ou relativo a partir da raiz do backend
                    filepath = os.path.join("app/static/uploads", filename)
                    
                    if os.path.exists(filepath):
                        mime_type, _ = mimetypes.guess_type(filepath)
                        if not mime_type: mime_type = "image/jpeg"
                        
                        with open(filepath, "rb") as f:
                            encoded = base64.b64encode(f.read()).decode('utf-8')
                            media_content = encoded # Evolution API geralmente detecta ou aceita puro no campo media
                            
                            # Log para debug
                            print(f"📸 Convertido arquivo local {filename} para Base64 ({len(media_content)} chars)")
                except Exception as e:
                    print(f"⚠️ Falha ao converter imagem local para Base64: {e}. Tentando URL original.")

            elif "base64," in media_url:
                media_content = media_url.split("base64,")[1]

            url = f"{self.base_url}/message/sendMedia/{self.instance}"
            payload = {
                "number": numbers,
                "options": {
                    "delay": delay,
                    "presence": "composing"
                },
                "mediatype": "image", # TODO: Detectar se é video
                "caption": text,
                "media": media_content
            }
            
            # Ajuste fino p/ Video
            if media_url and (media_url.endswith('.mp4') or media_url.endswith('.webm')):
                 payload['mediatype'] = 'video'
        else:
            url = f"{self.base_url}/message/sendText/{self.instance}"
            payload = {
                "number": numbers,
                "options": {
                    "delay": delay,
                    "presence": "composing",
                    "linkPreview": False
                },
                "text": text
            }

        try:
            print(f"📤 Enviando WhatsApp para {numbers}...")
            response = requests.post(url, json=payload, headers=self._get_headers())
            
            if response.status_code not in [200, 201]:
                print(f"❌ Erro Evolution ({response.status_code}): {response.text}")
                return {"error": response.text, "status": response.status_code}
            
            return response.json()
        except requests.RequestException as e:
            print(f"❌ Erro de Conexão Evolution: {e}")
            return {"error": str(e)}

    def check_instance_status(self) -> Dict[str, Any]:
        """
        Verifica se a instância está conectada.
        """
        if not self.base_url: return {"status": "not_configured"}
        
        url = f"{self.base_url}/instance/connectionState/{self.instance}"
        try:
            response = requests.get(url, headers=self._get_headers())
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def fetch_history(self, phone: str, limit: int = 50) -> list:
        """
        Busca histórico de mensagens direto da Evolution API.
        """
        if not self.base_url or not self.api_key:
            return []

        import re
        numbers = re.sub(r'\D', '', phone)
        remote_jid = f"{numbers}@s.whatsapp.net"

        url = f"{self.base_url}/chat/findMessages/{self.instance}"
        payload = {
            "where": {
                "key": {
                    "remoteJid": remote_jid
                }
            },
            "options": {
                "limit": limit,
                "order": "DESC"
            }
        }

        try:
            print(f"🔍 Buscando histórico no Evolution para {remote_jid}...")
            # print(f"Payload: {payload}")
            response = requests.post(url, json=payload, headers=self._get_headers())
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Histórico encontrado: {len(data.get('messages', [])) if isinstance(data, dict) else len(data)} mensagens.")
                # A Evolution v2 retorna { messages: [...] } ou as vezes direto a lista
                messages = data.get('messages', []) if isinstance(data, dict) else data
                return messages
            else:
                print(f"❌ Erro Evolution History ({response.status_code}): {response.text}")
                return []
        except Exception as e:
            print(f"❌ Erro ao conectar Evolution History: {e}")
            return []

evolution_service = EvolutionService()

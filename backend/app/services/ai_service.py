import requests
import logging
import json
from typing import List, Dict, Optional, Any
from app.core.config import settings

class AIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.AI_MODEL
        self.api_url = "https://api.openai.com/v1/chat/completions"

    def generate_response(self, 
                          history: List[Dict[str, str]], 
                          system_prompt: str = "Você é um assistente útil.",
                          db: Any = None,
                          contact_id: str = None) -> str:
        
        if not self.api_key:
            logging.warning("⚠️ OpenAI API Key ausente.")
            return "Erro: IA não configurada."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # INJECT RULES
        system_prompt_enhanced = system_prompt + """
        
[SISTEMA - REGRAS OCULTAS]:
1. Se o usuário informar o nome dele, use a ferramenta 'update_contact_name'.
2. Se o usuário quiser AGENDAR, falar com ATENDENTE/HUMANO ou se você não souber responder algo complexo, use a ferramenta 'transfer_to_human'. Ao usar essa ferramenta, avise o cliente que você está transferindo (ex: 'Vou transferir para nossa atendente humana').
"""

        messages = [{"role": "system", "content": system_prompt_enhanced}]
        
        for msg in history:
            if msg.get('role') in ['user', 'assistant', 'system', 'tool']:
                messages.append(msg)
        
        # DEFINIÇÃO DAS TOOLS
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "update_contact_name",
                    "description": "Salva o nome do cliente.",
                    "parameters": {
                        "type": "object",
                        "properties": { "name": { "type": "string" } },
                        "required": ["name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "transfer_to_human",
                    "description": "Transfere o atendimento para um humano (Responder Manual). Use quando o cliente quer agendar ou falar com gente.",
                    "parameters": {
                        "type": "object",
                        "properties": { "reason": { "type": "string", "description": "Motivo da transferência" } },
                        "required": ["reason"]
                    }
                }
            }
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.5, # Mais focado
            "max_tokens": 400,
            "tools": tools,
            "tool_choice": "auto"
        }
        
        try:
            logging.info(f"🤖 IA Check (Tools Enabled)...")
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=20)
            
            if response.status_code != 200:
                logging.error(f"❌ Erro OpenAI: {response.text}")
                return "Desculpe, instabilidade momentânea."

            data = response.json()
            message = data['choices'][0]['message']
            
            # CHECK TOOL CALLS
            if message.get('tool_calls'):
                tool_call = message['tool_calls'][0]
                fn_name = tool_call['function']['name']
                fn_args = json.loads(tool_call['function']['arguments'])
                
                logging.info(f"🛠️ IA solicitou função: {fn_name} com {fn_args}")
                
                tool_result = "Função executada com sucesso."
                
                # --- UPDATE NAME ---
                if fn_name == 'update_contact_name':
                    if db and contact_id:
                        try:
                            from app.models.models import Contact
                            contact = db.query(Contact).filter(Contact.id == contact_id).first()
                            if contact:
                                contact.full_name = fn_args.get('name')
                                db.commit()
                                tool_result = f"Nome salvo: {contact.full_name}"
                        except Exception as e:
                            tool_result = f"Erro: {str(e)}"
                
                # --- TRANSFER TO HUMAN ---
                elif fn_name == 'transfer_to_human':
                    if db and contact_id:
                        try:
                            from app.models.models import LeadPipeline
                            import uuid
                            cid = contact_id
                            if isinstance(cid, str):
                                try: cid = uuid.UUID(cid)
                                except: pass

                            pipeline = db.query(LeadPipeline).filter(LeadPipeline.contact_id == cid).first()
                            if pipeline:
                                pipeline.stage = 'agendado' # Mapeado para 'RESPONDER MANUAL' no frontend
                                db.commit()
                                tool_result = "Lead movido para 'Responder Manual' (agendado). A IA irá parar de responder agora."
                                logging.info("✅ Lead transferido para HUMANO.")
                        except Exception as e:
                            tool_result = f"Erro ao transferir: {str(e)}"

                # Loop de resposta
                messages.append(message)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call['id'],
                    "content": tool_result
                })
                
                payload['messages'] = messages
                logging.info("🤖 Re-enviando para IA gerar resposta final...")
                
                resp2 = requests.post(self.api_url, json=payload, headers=headers, timeout=20)
                if resp2.status_code == 200:
                    return resp2.json()['choices'][0]['message']['content']
                else:
                    return "Entendido. Transferindo."

            return message['content']

        except Exception as e:
            logging.error(f"❌ Exception AI Service: {e}")
            return "Ocorreu um erro ao processar sua solicitação."

ai_service = AIService()

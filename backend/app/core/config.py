from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Plataforma Clínica"
    DATABASE_URL: str
    
    # Clinicorp
    CLINICORP_API_KEY: Optional[str] = None
    CLINICORP_API_URL: Optional[str] = None

    # Evolution API
    EVOLUTION_API_URL: Optional[str] = None
    EVOLUTION_API_KEY: Optional[str] = None
    EVOLUTION_INSTANCE_NAME: str = "clinica_principal"

    # AI Config
    OPENAI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-4o"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import shutil
import os
from uuid import uuid4

from app.core.config import settings
from app.db.session import engine
from app.db.session import SessionLocal
from app.services.campaign_service import campaign_service
from app.db.base import Base
from app.models import models 

# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# --- WORKER SCHEDULER ---
scheduler = BackgroundScheduler()

def run_campaign_worker():
    # Executa verificação da fila
    db = SessionLocal()
    try:
        campaign_service.process_queue(db)
    except Exception as e:
        print(f"Worker Error: {e}")
    finally:
        db.close()

# Roda worker a cada 10 segundos
scheduler.add_job(run_campaign_worker, 'interval', seconds=10)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Inicializando Worker de Disparos...")
    scheduler.start()
    yield
    print("🛑 Encerrando Worker...")
    scheduler.shutdown()

# --- APP SETUP ---
app = FastAPI(
    title="Plataforma Clínica",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# Configuração de CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir Arquivos Estáticos
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.post("/api/v1/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1]
    filename = f"{uuid4()}.{ext}"
    path = f"app/static/uploads/{filename}"
    
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://127.0.0.1:8000/static/uploads/{filename}"}

@app.get("/")
def read_root():
    return {"message": "Plataforma Clínica API rodando", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "ok", "db": "not_connected_yet", "worker": "active"}

from app.api.v1.api import api_router
app.include_router(api_router, prefix="/api/v1")

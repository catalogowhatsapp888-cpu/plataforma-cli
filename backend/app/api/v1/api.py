from fastapi import APIRouter
from app.api.v1.endpoints import clinicorp, leads, webhook, campaigns

api_router = APIRouter()
api_router.include_router(clinicorp.router, prefix="/clinicorp", tags=["clinicorp"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])

from app.api.v1.endpoints import ai, settings, auth, users, tenants
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])

from app.api.v1.endpoints import knowledge
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.models import Tenant, User
from app.schemas import tenant as schemas

router = APIRouter()

@router.get("/me", response_model=schemas.Tenant)
def read_my_tenant(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current tenant details.
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        # Fallback if somehow UUID mismatch (should be fixed)
        # Try finding by string if UUID fails
        import uuid
        try:
             # Just query by user tenant_id, assumes it matches
             pass
        except:
             pass
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/me", response_model=schemas.Tenant)
def update_my_tenant(
    *,
    db: Session = Depends(deps.get_db),
    tenant_in: schemas.TenantUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update my tenant. Only Admin can do this.
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    update_data = tenant_in.model_dump(exclude_unset=True)
    
    # Merge Config logic
    if "config" in update_data:
         current_config = tenant.config if tenant.config else {}
         # Se o novo config for dict, merge.
         if isinstance(update_data["config"], dict):
             current_config.update(update_data["config"])
             update_data["config"] = current_config
         # Se for None, ignora ou limpa? Exclude unset takes care 

    for field in update_data:
        setattr(tenant, field, update_data[field])

    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

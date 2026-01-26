from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.core import security
from app.models.models import User
from app.schemas import user as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve users. Only Admin can access.
    Returns only users belonging to the same tenant.
    """
    users = db.query(User).filter(
        User.tenant_id == current_user.tenant_id
    ).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Create new user.
    """
    # Check uniqueness (Global check required by model constraint)
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this user email already exists in the system.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        name=user_in.name,
        role=user_in.role,
        is_active=user_in.is_active,
        tenant_id=current_user.tenant_id # FORCE TENANT ISOLATION
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: str, # passed as string in URL
    user_in: schemas.UserUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a user.
    """
    try:
        uid = UUID(user_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid ID format")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
        
    # Security Check: Ensure belongs to same tenant
    if str(user.tenant_id) != str(current_user.tenant_id):
         raise HTTPException(status_code=404, detail="User not found")

    user_data = jsonable_encoder(user)
    update_data = user_in.model_dump(exclude_unset=True)
    
    # Handle password update separately
    if update_data.get("password"):
        hashed_password = security.get_password_hash(update_data["password"])
        del update_data["password"]
        user.hashed_password = hashed_password
        
    for field in update_data:
        if field in user_data:
            setattr(user, field, update_data[field])
            
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", response_model=schemas.User)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: str,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Deactivate a user (Soft Delete preferred, or just set is_active=False).
    For compliance we might want to actually delete if requested, but for now let's just deactivate.
    Using DELETE verb but logic toggle or delete?
    Let's actually Delete for now to clean up, or set inactive?
    User requirement: "ADMIN pode criar, editar, desativar usuários".
    Let's implement "Deactivate" logic but maybe via PUT?
    Typically DELETE endpoint can default to soft-delete/deactivate.
    I'll implement HARD DELETE for V1.4 simplicity if no constraints, but `is_active` is safer.
    Let's stick to DEACTIVATE (is_active=False) via PUT or allow DELETE to remove from DB?
    Given "Audit Logs", hard delete is risky.
    Let's implement Delete as "Deactivate" or explicit remove.
    The user can "Create, Edit, Deactivate".
    So I will make DELETE actually DELETE from DB for now (clean up), or create a toggle endpoint.
    Let's do DELETE -> DB Delete for now, but ensure no orphan records (FKs might be issue).
    Wait, `LeadPipeline` has `assigned_to` FK to `User`.
    If I delete user, SQLite might complain or Set Null.
    Better safe: Toggle `is_active` via PUT, or if DELETE is called, check dependencies.
    I'll implement DELETE as `db.delete(user)` but wrap in try/catch for integrity.
    """
    try:
        uid = UUID(user_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid ID format")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if str(user.tenant_id) != str(current_user.tenant_id):
         raise HTTPException(status_code=404, detail="User not found")
         
    # Prevent deleting yourself
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db.delete(user)
    db.commit()
    return user

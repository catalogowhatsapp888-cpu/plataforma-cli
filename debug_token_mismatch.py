import requests
from app.core.config import settings
from app.api import deps
from app.db.session import SessionLocal
from app.models.models import User, Tenant
from app.core import security
from jose import jwt
import uuid

# Simulate the backend logic in a script
def debug_mismatch():
    db = SessionLocal()
    email = "eduschefer@icloud.com"
    
    print(f"🔍 Investigating User: {email}")
    
    # 1. Get User from DB
    # Note: Querying directly via ORM, assuming it mirrors the app's behavior
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print("❌ User not found in DB!")
        return

    print(f"✅ User ID: {user.id} (Type: {type(user.id)})")
    print(f"✅ User Tenant ID: {user.tenant_id} (Type: {type(user.tenant_id)})")
    
    # 2. Get Tenant
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        print("❌ Tenant not found in DB via ORM!")
    else:
        print(f"✅ Tenant ID (ORM): {tenant.id} (Type: {type(tenant.id)})")

    # 3. Simulate Login / Token Creation
    token_data = {
        "sub": str(user.id),
        "tid": str(user.tenant_id), # This is what usually goes into token
        "role": user.role
    }
    print(f"📝 Paylod to Encode: {token_data}")
    
    # Simulate Deps Validation
    token_tid = token_data["tid"]
    db_user_tid = str(user.tenant_id)
    
    print(f"🔐 Token TID: {token_tid}")
    print(f"🗄️ DB User TID: {db_user_tid}")
    
    if str(token_tid) != str(db_user_tid):
        print("❌ MISMATCH DETECTED in String Comparison!")
    else:
        print("✅ String Comparison MATCHES.")
        
    # Check if mismatch against Tenant ID in logic?
    # deps.py:
    # if str(user.tenant_id) != str(tenant_id): -> Matches
    
    # What if Tenant is not found?
    # endpoints/campaigns.py query:
    # campaigns = db.query(Campaign).filter(Campaign.tenant_id == current_user.tenant_id).all()
    # Does this query fail?
    
    print("\n🔍 Testing Campaigns Query logic...")
    try:
        from app.models.models import Campaign
        campaigns = db.query(Campaign).filter(Campaign.tenant_id == user.tenant_id).all()
        print(f"✅ Campaigns Query: Found {len(campaigns)} campaigns.")
    except Exception as e:
        print(f"❌ Campaigns Query Failed: {e}")

    db.close()

if __name__ == "__main__":
    debug_mismatch()

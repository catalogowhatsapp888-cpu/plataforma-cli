import sys
import os
from passlib.context import CryptContext

sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin():
    db = SessionLocal()
    try:
        email = "admin@admin.com"
        password = "123456" 
        
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"⚠️ Usuário {email} já existe.")
            return

        new_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role="admin",
            is_active=True,
            name="Admin"
        )
        db.add(new_user)
        db.commit()
        print(f"✅ Usuário Admin criado!\nLogin: {email}\nSenha: {password}")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()

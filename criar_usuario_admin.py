from passlib.context import CryptContext
from app.db.session import SessionLocal
from app.models.models import User
import sys
import os

# Contexto para Hashing de Senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin():
    db = SessionLocal()
    try:
        email = "admin@clinica.com"
        password = "admin123" # Senha Padrão
        
        # Verificar se já existe
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"⚠️ Usuário {email} já existe.")
            
            # Opcional: Atualizar senha se já existir (útil para reset)
            # existing_user.hashed_password = get_password_hash(password)
            # db.commit()
            # print("Senha resetada para 'admin123'.")
            return

        new_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role="admin",
            is_active=True
        )
        db.add(new_user)
        db.commit()
        print(f"✅ Usuário Admin criado com sucesso!\nEmail: {email}\nSenha: {password}")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Adicionar diretório atual ao path para importar 'app'
    sys.path.append(os.getcwd())
    create_admin()

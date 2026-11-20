import os
import sys

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash, verify_password

def update_and_verify_users():
    db = SessionLocal()
    try:
        print("=== FIXING USER ROLES & VERIFYING ACCOUNTS ===")
        
        # 1. Update SK Relax Owner
        salma = db.query(User).filter(User.email == "salma@skrelax.com").first()
        if salma:
            salma.role = UserRole.SALON_OWNER.value
            salma.is_active = True
            if not verify_password("Salma@2026", salma.hashed_password):
                salma.hashed_password = get_password_hash("Salma@2026")
                print("  Updated Salma's password hash to match Salma@2026")
            print(f"  Salma Attar: role={salma.role}, tenant_id={salma.tenant_id}, active={salma.is_active}")
        
        # 2. Update SK Relax Staff
        manager = db.query(User).filter(User.email == "manager@skrelax.com").first()
        if manager:
            manager.role = UserRole.SALON_MANAGER.value
            manager.is_active = True
            print(f"  Manager: role={manager.role}")

        reception = db.query(User).filter(User.email == "reception@skrelax.com").first()
        if reception:
            reception.role = UserRole.SALON_RECEPTIONIST.value
            reception.is_active = True
            print(f"  Receptionist: role={reception.role}")

        stylist = db.query(User).filter(User.email == "stylist@skrelax.com").first()
        if stylist:
            stylist.role = UserRole.SALON_BEAUTICIAN.value
            stylist.is_active = True
            print(f"  Stylist: role={stylist.role}")

        # 3. Verify Elegance Studio Owner
        elegance_owner = db.query(User).filter(User.email == "rahul@elegancehairstudio.com").first()
        if elegance_owner:
            elegance_owner.role = UserRole.SALON_OWNER.value
            print(f"  Elegance Owner: role={elegance_owner.role}")

        # 4. Verify Super Admin
        admin = db.query(User).filter(User.email == "admin@cloudtechnologies.in").first()
        if admin:
            admin.role = UserRole.PLATFORM_SUPER_ADMIN.value
            admin.tenant_id = None
            admin.is_active = True
            if not verify_password("CloudAdmin@2026", admin.hashed_password):
                admin.hashed_password = get_password_hash("CloudAdmin@2026")
                print("  Updated Admin's password hash to match CloudAdmin@2026")
            print(f"  Super Admin: role={admin.role}, tenant_id={admin.tenant_id}, active={admin.is_active}")

        db.commit()
        print("Successfully committed updated roles and verified accounts!")
    except Exception as e:
        db.rollback()
        print(f"Error updating roles: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_and_verify_users()

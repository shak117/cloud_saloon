import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from app.core.database import Base
from app.models.base import generate_uuid, utc_now

class UserRole(str, enum.Enum):
    # Platform Administration Role
    PLATFORM_SUPER_ADMIN = "PLATFORM_SUPER_ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"  # Backward-compatible alias
    
    # Salon Tenant Roles
    SALON_OWNER = "SALON_OWNER"
    OWNER = "OWNER"  # Backward-compatible alias
    
    SALON_MANAGER = "SALON_MANAGER"
    MANAGER = "MANAGER"  # Backward-compatible alias
    
    SALON_RECEPTIONIST = "SALON_RECEPTIONIST"
    RECEPTIONIST = "RECEPTIONIST"  # Backward-compatible alias
    
    SALON_CASHIER = "SALON_CASHIER"
    CASHIER = "CASHIER"  # Backward-compatible alias
    
    SALON_BEAUTICIAN = "SALON_BEAUTICIAN"
    BEAUTICIAN = "BEAUTICIAN"  # Backward-compatible alias
    
    SALON_INVENTORY_MANAGER = "SALON_INVENTORY_MANAGER"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"  # Backward-compatible alias

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.SALON_RECEPTIONIST.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        # Scoped unique constraint for salon users: within the same tenant, email must be unique
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
    )

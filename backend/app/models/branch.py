from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, utc_now, TenantModelMixin

class Branch(Base, TenantModelMixin):
    __tablename__ = "branches"

    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), default="Satara")
    state = Column(String(100), default="Maharashtra")
    pincode = Column(String(10), default="415002")
    is_main = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_branches_tenant_name"),
    )

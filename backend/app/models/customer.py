from sqlalchemy import Column, String, Boolean, Numeric, Integer, Text, Date, UniqueConstraint
from app.core.database import Base
from app.models.base import TenantModelMixin

class Customer(Base, TenantModelMixin):
    __tablename__ = "customers"

    full_name = Column(String(255), nullable=False, index=True)
    mobile = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    gender = Column(String(20), nullable=True)  # Female, Male, Non-binary, Other
    dob = Column(Date, nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    preferences = Column(Text, nullable=True)  # e.g., "Prefers organic facial kits, allergic to ammonia"
    vip_status = Column(Boolean, default=False, nullable=False)
    
    # Aggregated metrics for quick display
    total_spend = Column(Numeric(12, 2), default=0.0, nullable=False)
    total_visits = Column(Integer, default=0, nullable=False)
    last_visit_date = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "mobile", name="uq_customers_tenant_mobile"),
    )

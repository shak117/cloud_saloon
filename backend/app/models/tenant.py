from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey, JSON
from app.core.database import Base
from app.models.base import utc_now

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True)  # e.g., 'sk-relax-satara'
    name = Column(String(255), nullable=False)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    business_type = Column(String(50), default="SALON_AND_SPA", nullable=False)
    owner_name = Column(String(255), nullable=True)
    legal_name = Column(String(255), nullable=True)
    gstin = Column(String(15), nullable=True)
    pan = Column(String(10), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), default="Satara")
    state = Column(String(100), default="Maharashtra")
    state_code = Column(String(2), default="27")  # Maharashtra GST State Code
    pincode = Column(String(10), default="415002")
    currency = Column(String(10), default="INR")
    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    logo_url = Column(String(500), nullable=True)
    
    # Subscription Management
    subscription_plan_id = Column(String(36), ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True)
    subscription_status = Column(String(20), default="ACTIVE", nullable=False)  # TRIAL, ACTIVE, EXPIRED, SUSPENDED
    subscription_start_date = Column(DateTime(timezone=True), nullable=True)
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    suspension_reason = Column(Text, nullable=True)
    
    # Tax & Invoice Configuration
    tax_configuration = Column(JSON, nullable=True)
    invoice_prefix = Column(String(10), default="CS-")
    invoice_sequence = Column(Integer, default=1001)
    thermal_header = Column(Text, nullable=True)
    thermal_footer = Column(Text, default="Thank you for visiting! Please visit again.")
    
    # Salon Operations Settings
    opening_time = Column(String(10), default="10:00")
    closing_time = Column(String(10), default="20:00")
    default_appointment_duration = Column(Integer, default=30)  # minutes
    
    # Flags
    is_demo = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    @property
    def salon_name(self) -> str:
        return self.name

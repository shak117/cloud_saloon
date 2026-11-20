import enum
from sqlalchemy import Column, String, Boolean, Numeric
from app.core.database import Base
from app.models.base import TenantModelMixin

class CommissionType(str, enum.Enum):
    NONE = "NONE"
    FIXED = "FIXED"
    PERCENTAGE = "PERCENTAGE"

class Staff(Base, TenantModelMixin):
    __tablename__ = "staff"

    user_id = Column(String(36), nullable=True)  # Optional link to user login
    name = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    designation = Column(String(100), default="Stylist")
    specialization = Column(String(255), default="All Services")
    color_code = Column(String(10), default="#C5A059")  # Hex code for calendar column badge
    
    # Commission rules
    commission_type = Column(String(50), default=CommissionType.PERCENTAGE.value, nullable=False)
    commission_rate = Column(Numeric(10, 2), default=10.0, nullable=False)  # 10% or ₹100
    
    # Working hours
    working_hours_start = Column(String(10), default="10:00")
    working_hours_end = Column(String(10), default="20:00")
    
    is_active = Column(Boolean, default=True, nullable=False)

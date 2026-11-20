import enum
from sqlalchemy import Column, String, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TenantModelMixin

class AppointmentStatus(str, enum.Enum):
    BOOKED = "BOOKED"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class Appointment(Base, TenantModelMixin):
    __tablename__ = "appointments"

    appointment_number = Column(String(50), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    
    service_id = Column(String(36), ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    staff_id = Column(String(36), ForeignKey("staff.id", ondelete="RESTRICT"), nullable=False)
    
    appointment_date = Column(Date, nullable=False, index=True)
    start_time = Column(String(10), nullable=False)  # HH:MM format e.g. "11:00"
    end_time = Column(String(10), nullable=False)    # HH:MM format e.g. "11:45"
    
    status = Column(String(50), default=AppointmentStatus.BOOKED.value, nullable=False)
    is_walkin = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    invoice_id = Column(String(36), nullable=True)

    customer = relationship("Customer")
    service = relationship("Service")
    staff = relationship("Staff")

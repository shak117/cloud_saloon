from sqlalchemy import Column, String, Boolean, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TenantModelMixin
from app.models.staff import CommissionType

class StaffCommission(Base, TenantModelMixin):
    __tablename__ = "staff_commissions"

    staff_id = Column(String(36), ForeignKey("staff.id", ondelete="CASCADE"), nullable=False)
    invoice_item_id = Column(String(36), ForeignKey("invoice_items.id", ondelete="CASCADE"), nullable=False)
    
    commission_type = Column(String(20), default=CommissionType.PERCENTAGE, nullable=False)
    commission_rate = Column(Numeric(10, 2), nullable=False)
    service_amount = Column(Numeric(10, 2), nullable=False)
    commission_amount = Column(Numeric(10, 2), nullable=False)
    
    is_paid = Column(Boolean, default=False, nullable=False)
    paid_date = Column(Date, nullable=True)

    staff = relationship("Staff")
    invoice_item = relationship("InvoiceItem")

import enum
from sqlalchemy import Column, String, Numeric, Text, Date
from app.core.database import Base
from app.models.base import TenantModelMixin
from app.models.invoice import PaymentMethod

class ExpenseCategory(str, enum.Enum):
    RENT = "RENT"
    SALARY = "SALARY"
    ELECTRICITY = "ELECTRICITY"
    SUPPLIES = "SUPPLIES"
    MARKETING = "MARKETING"
    MAINTENANCE = "MAINTENANCE"
    EQUIPMENT = "EQUIPMENT"
    OTHER = "OTHER"

class Expense(Base, TenantModelMixin):
    __tablename__ = "expenses"

    title = Column(String(255), nullable=False)
    category = Column(String(50), default=ExpenseCategory.OTHER.value, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False)
    payment_method = Column(String(50), default=PaymentMethod.CASH.value, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String(500), nullable=True)
    created_by_id = Column(String(36), nullable=True)

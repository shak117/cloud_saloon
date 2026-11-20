from typing import Optional
from decimal import Decimal
from datetime import date
from pydantic import BaseModel

class ExpenseCreate(BaseModel):
    title: str
    category: str = "OTHER"
    amount: Decimal
    expense_date: date
    payment_method: str = "CASH"
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    category: str
    amount: Decimal
    expense_date: date
    payment_method: str
    description: Optional[str] = None
    receipt_url: Optional[str] = None

    class Config:
        from_attributes = True

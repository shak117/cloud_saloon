from typing import Optional
from decimal import Decimal
from datetime import date
from pydantic import BaseModel

class CustomerCreate(BaseModel):
    full_name: str
    mobile: str
    email: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    preferences: Optional[str] = None
    vip_status: bool = False

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    preferences: Optional[str] = None
    vip_status: Optional[bool] = None
    is_active: Optional[bool] = None

class CustomerResponse(BaseModel):
    id: str
    tenant_id: str
    full_name: str
    mobile: str
    email: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    preferences: Optional[str] = None
    vip_status: bool
    total_spend: Decimal
    total_visits: int
    last_visit_date: Optional[date] = None
    is_active: bool

    class Config:
        from_attributes = True

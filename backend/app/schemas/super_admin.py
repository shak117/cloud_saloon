from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr

class SalonRegisterRequest(BaseModel):
    salon_name: str
    owner_name: str
    owner_email: EmailStr
    owner_phone: str
    owner_password: str
    plan_id: str = "plan-professional"
    is_trial: bool = True
    city: str = "Satara"
    state: str = "Maharashtra"
    address: Optional[str] = None

class SalonStatusUpdateRequest(BaseModel):
    status: str  # ACTIVE, SUSPENDED
    reason: Optional[str] = None

class RecordPaymentRequest(BaseModel):
    salon_id: str
    plan_id: str
    amount: Decimal
    billing_cycle: str = "MONTHLY"
    payment_reference: str
    duration_months: int = 1
    notes: Optional[str] = None

class PlanUpdateRequest(BaseModel):
    monthly_price: Optional[Decimal] = None
    setup_fee: Optional[Decimal] = None
    annual_price: Optional[Decimal] = None
    branch_limit: Optional[int] = None
    staff_limit: Optional[int] = None
    trial_days: Optional[int] = None
    feature_configuration: Optional[Dict[str, Any]] = None

class SuperAdminMetricsResponse(BaseModel):
    total_salons: int
    active_salons: int
    trial_salons: int
    expired_salons: int
    suspended_salons: int
    professional_subscribers: int
    business_subscribers: int
    mrr_amount: Decimal
    platform_health: str
    database_status: str
    version: str

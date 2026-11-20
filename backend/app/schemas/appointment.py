from typing import Optional
from datetime import date
from pydantic import BaseModel

class AppointmentCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    service_id: str
    staff_id: str
    appointment_date: date
    start_time: str  # HH:MM format e.g. "11:30"
    end_time: Optional[str] = None  # auto-computed from service duration if None
    notes: Optional[str] = None
    is_walkin: bool = False

class AppointmentUpdate(BaseModel):
    service_id: Optional[str] = None
    staff_id: Optional[str] = None
    appointment_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None  # BOOKED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

class AppointmentConflictCheck(BaseModel):
    staff_id: str
    appointment_date: date
    start_time: str
    end_time: str
    exclude_appointment_id: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    tenant_id: str
    appointment_number: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    service_id: str
    staff_id: str
    appointment_date: date
    start_time: str
    end_time: str
    status: str
    is_walkin: bool
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    invoice_id: Optional[str] = None
    service_name: Optional[str] = None
    staff_name: Optional[str] = None
    staff_color: Optional[str] = None

    class Config:
        from_attributes = True

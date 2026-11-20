from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.models.staff import Staff
from app.models.customer import Customer
from app.services.conflict_engine import check_staff_conflict
from app.services.recipe_engine import deduct_service_consumables
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentConflictCheck
)

router = APIRouter(prefix="/appointments", tags=["Appointment Scheduling"])

def compute_end_time(start_time: str, duration_minutes: int) -> str:
    """Helper to add minutes to HH:MM format."""
    try:
        dt = datetime.strptime(start_time, "%H:%M")
        end_dt = dt + timedelta(minutes=duration_minutes)
        return end_dt.strftime("%H:%M")
    except Exception:
        return start_time

@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    appointment_date: Optional[date] = None,
    staff_id: Optional[str] = None,
    status: Optional[str] = None,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)
    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)
    if staff_id:
        query = query.filter(Appointment.staff_id == staff_id)
    if status:
        query = query.filter(Appointment.status == status)
        
    appts = query.order_by(Appointment.appointment_date, Appointment.start_time).all()
    results = []
    for a in appts:
        res = AppointmentResponse.model_validate(a)
        res.service_name = a.service.name if a.service else "Service"
        res.staff_name = a.staff.name if a.staff else "Stylist"
        res.staff_color = a.staff.color_code if a.staff else "#C5A059"
        results.append(res)
    return results

@router.post("/check-conflict")
def check_conflict_api(
    req: AppointmentConflictCheck,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    has_conflict, conflicting_appt = check_staff_conflict(
        db=db,
        tenant_id=tenant_id,
        staff_id=req.staff_id,
        appointment_date=req.appointment_date,
        start_time=req.start_time,
        end_time=req.end_time,
        exclude_appointment_id=req.exclude_appointment_id
    )
    if has_conflict and conflicting_appt:
        return {
            "conflict": True,
            "message": f"Staff member is already booked for '{conflicting_appt.customer_name}' from {conflicting_appt.start_time} to {conflicting_appt.end_time} ({conflicting_appt.appointment_number}).",
            "conflicting_appointment_id": conflicting_appt.id
        }
    return {"conflict": False, "message": "Time slot is available."}

@router.post("", response_model=AppointmentResponse)
def create_appointment(
    req: AppointmentCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    # Verify service
    service = db.query(Service).filter(Service.id == req.service_id, Service.tenant_id == tenant_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")
        
    # Verify staff
    staff = db.query(Staff).filter(Staff.id == req.staff_id, Staff.tenant_id == tenant_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")
        
    # Compute end time if not given
    end_time = req.end_time or compute_end_time(req.start_time, service.duration_minutes)
    
    # Conflict check
    has_conflict, conflicting_appt = check_staff_conflict(
        db=db,
        tenant_id=tenant_id,
        staff_id=req.staff_id,
        appointment_date=req.appointment_date,
        start_time=req.start_time,
        end_time=end_time
    )
    if has_conflict and conflicting_appt:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Scheduling conflict: {staff.name} is already booked for '{conflicting_appt.customer_name}' from {conflicting_appt.start_time} to {conflicting_appt.end_time}."
        )

    # Generate appointment number
    seq = db.query(Appointment).filter(Appointment.tenant_id == tenant_id).count() + 1
    num_str = f"APT-{req.appointment_date.strftime('%Y%m%d')}-{seq:03d}"

    appt = Appointment(
        tenant_id=tenant_id,
        appointment_number=num_str,
        customer_id=req.customer_id,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        service_id=req.service_id,
        staff_id=req.staff_id,
        appointment_date=req.appointment_date,
        start_time=req.start_time,
        end_time=end_time,
        status=AppointmentStatus.BOOKED.value,
        is_walkin=req.is_walkin,
        notes=req.notes
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    res = AppointmentResponse.model_validate(appt)
    res.service_name = service.name
    res.staff_name = staff.name
    res.staff_color = staff.color_code
    return res

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: str,
    req: AppointmentUpdate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Check conflict if time or staff changed
    new_staff_id = req.staff_id or appt.staff_id
    new_date = req.appointment_date or appt.appointment_date
    new_start = req.start_time or appt.start_time
    new_end = req.end_time or appt.end_time

    if req.staff_id or req.appointment_date or req.start_time or req.end_time:
        has_conflict, conflicting = check_staff_conflict(
            db=db,
            tenant_id=tenant_id,
            staff_id=new_staff_id,
            appointment_date=new_date,
            start_time=new_start,
            end_time=new_end,
            exclude_appointment_id=appointment_id
        )
        if has_conflict and conflicting:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Scheduling conflict: Staff already booked for {conflicting.customer_name} from {conflicting.start_time} to {conflicting.end_time}."
            )

    old_status = appt.status
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(appt, k, v)

    # If marked COMPLETED now, trigger consumable auto-deduction
    if req.status == AppointmentStatus.COMPLETED.value and old_status != AppointmentStatus.COMPLETED.value:
        deduct_service_consumables(
            db=db,
            tenant_id=tenant_id,
            service_id=appt.service_id,
            reference_id=appt.id,
            service_name=appt.service.name if appt.service else None
        )

    db.commit()
    db.refresh(appt)

    res = AppointmentResponse.model_validate(appt)
    res.service_name = appt.service.name if appt.service else "Service"
    res.staff_name = appt.staff.name if appt.staff else "Stylist"
    res.staff_color = appt.staff.color_code if appt.staff else "#C5A059"
    return res

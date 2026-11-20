from typing import Optional, Tuple
from datetime import date
from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus

def check_staff_conflict(
    db: Session,
    tenant_id: str,
    staff_id: str,
    appointment_date: date,
    start_time: str,
    end_time: str,
    exclude_appointment_id: Optional[str] = None
) -> Tuple[bool, Optional[Appointment]]:
    """
    Checks if a staff member already has an overlapping appointment on the given date.
    Returns (has_conflict, conflicting_appointment).
    """
    query = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.staff_id == staff_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status.notin_([AppointmentStatus.CANCELLED.value, AppointmentStatus.NO_SHOW.value])
    )
    
    if exclude_appointment_id:
        query = query.filter(Appointment.id != exclude_appointment_id)
        
    existing_appointments = query.all()
    
    for appt in existing_appointments:
        # Check interval overlap: max(start1, start2) < min(end1, end2)
        if max(start_time, appt.start_time) < min(end_time, appt.end_time):
            return True, appt
            
    return False, None

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.appointment import Appointment
from app.models.package import CustomerPackage
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customer CRM"])

@router.get("", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = None,
    vip_only: bool = False,
    limit: int = 50,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.is_active == True)
    if vip_only:
        query = query.filter(Customer.vip_status == True)
    if search:
        query = query.filter(
            (Customer.full_name.ilike(f"%{search}%")) |
            (Customer.mobile.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%"))
        )
    return query.order_by(Customer.full_name).limit(limit).all()

@router.get("/lookup")
def lookup_customer_by_mobile(
    mobile: str = Query(...),
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    cust = db.query(Customer).filter(
        Customer.tenant_id == tenant_id,
        Customer.mobile.ilike(f"%{mobile.strip()}%"),
        Customer.is_active == True
    ).first()
    if not cust:
        return None
    return CustomerResponse.model_validate(cust)

@router.get("/{customer_id}/profile")
def get_customer_profile(
    customer_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    cust = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.customer_id == customer_id
    ).order_by(Invoice.invoice_date.desc()).limit(10).all()
    
    appointments = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.customer_id == customer_id
    ).order_by(Appointment.appointment_date.desc()).limit(10).all()
    
    packages = db.query(CustomerPackage).filter(
        CustomerPackage.tenant_id == tenant_id,
        CustomerPackage.customer_id == customer_id
    ).all()
    
    return {
        "customer": CustomerResponse.model_validate(cust),
        "invoices": [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "date": inv.invoice_date.isoformat(),
                "total": float(inv.total_amount),
                "status": inv.payment_status
            } for inv in invoices
        ],
        "appointments": [
            {
                "id": a.id,
                "number": a.appointment_number,
                "date": a.appointment_date.isoformat(),
                "time": a.start_time,
                "service": a.service.name if a.service else "Service",
                "staff": a.staff.name if a.staff else "Stylist",
                "status": a.status
            } for a in appointments
        ],
        "active_packages": [
            {
                "id": cp.id,
                "package_name": cp.package.name if cp.package else "Package",
                "total_sessions": cp.total_sessions,
                "used_sessions": cp.used_sessions,
                "remaining_sessions": cp.remaining_sessions,
                "expiry_date": cp.expiry_date.isoformat(),
                "status": cp.status
            } for cp in packages
        ]
    }

@router.post("", response_model=CustomerResponse)
def create_customer(
    req: CustomerCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    existing = db.query(Customer).filter(
        Customer.tenant_id == tenant_id,
        Customer.mobile == req.mobile
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this mobile number already exists.")
        
    cust = Customer(
        tenant_id=tenant_id,
        full_name=req.full_name,
        mobile=req.mobile,
        email=req.email,
        gender=req.gender,
        dob=req.dob,
        address=req.address,
        notes=req.notes,
        preferences=req.preferences,
        vip_status=req.vip_status,
        is_active=True
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    req: CustomerUpdate,
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    cust = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(cust, k, v)
        
    db.commit()
    db.refresh(cust)
    return cust

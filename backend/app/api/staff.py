from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id, get_current_tenant, require_active_subscription, require_feature
from app.models.staff import Staff
from app.models.tenant import Tenant
from app.models.subscription import SubscriptionPlan
from app.models.commission import StaffCommission
from app.schemas.staff import StaffCreate, StaffUpdate, StaffResponse

router = APIRouter(prefix="/staff", tags=["Staff Management"])

@router.get("", response_model=List[StaffResponse])
def list_staff(
    active_only: bool = True,
    tenant: Tenant = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    query = db.query(Staff).filter(Staff.tenant_id == tenant.id)
    if active_only:
        query = query.filter(Staff.is_active == True)
    return query.order_by(Staff.name).all()

@router.post("", response_model=StaffResponse)
def create_staff(
    req: StaffCreate,
    tenant: Tenant = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    # Enforce subscription plan staff limit
    if tenant.subscription_plan_id:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant.subscription_plan_id).first()
        if plan and plan.staff_limit:
            existing_count = db.query(Staff).filter(Staff.tenant_id == tenant.id, Staff.is_active == True).count()
            if existing_count >= plan.staff_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Staff limit reached ({existing_count}/{plan.staff_limit}). Cloud Salon {plan.plan_name} allows up to {plan.staff_limit} staff members. Upgrade to Cloud Salon Business for unlimited staff accounts."
                )

    # Check commission gating
    if req.commission_type and req.commission_type != "NONE":
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant.subscription_plan_id).first()
        if plan and not (plan.feature_configuration or {}).get("advanced_commissions", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Advanced staff commissions are available in Cloud Salon Business. Upgrade to ₹1,799/month to unlock this feature."
            )

    staff = Staff(
        tenant_id=tenant.id,
        name=req.name,
        mobile=req.mobile,
        email=req.email,
        designation=req.designation,
        specialization=req.specialization,
        color_code=req.color_code,
        commission_type=req.commission_type,
        commission_rate=req.commission_rate,
        working_hours_start=req.working_hours_start,
        working_hours_end=req.working_hours_end,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff

@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: str,
    req: StaffUpdate,
    tenant: Tenant = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    staff = db.query(Staff).filter(Staff.id == staff_id, Staff.tenant_id == tenant.id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")
        
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(staff, k, v)
        
    db.commit()
    db.refresh(staff)
    return staff

@router.get("/{staff_id}/commissions")
def get_staff_commissions(
    staff_id: str,
    is_paid: Optional[bool] = None,
    tenant: Tenant = Depends(require_feature("advanced_commissions")),
    db: Session = Depends(get_db)
):
    staff = db.query(Staff).filter(Staff.id == staff_id, Staff.tenant_id == tenant.id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")
        
    query = db.query(StaffCommission).filter(
        StaffCommission.tenant_id == tenant.id,
        StaffCommission.staff_id == staff_id
    )
    if is_paid is not None:
        query = query.filter(StaffCommission.is_paid == is_paid)
        
    commissions = query.order_by(StaffCommission.created_at.desc()).all()
    total_unpaid = sum((c.commission_amount for c in commissions if not c.is_paid), Decimal("0.0"))
    total_paid = sum((c.commission_amount for c in commissions if c.is_paid), Decimal("0.0"))
    
    return {
        "staff": StaffResponse.model_validate(staff),
        "total_unpaid_commission": total_unpaid,
        "total_paid_commission": total_paid,
        "records": [
            {
                "id": c.id,
                "service_amount": float(c.service_amount),
                "commission_rate": float(c.commission_rate),
                "commission_amount": float(c.commission_amount),
                "is_paid": c.is_paid,
                "date": c.created_at.isoformat()
            } for c in commissions
        ]
    }

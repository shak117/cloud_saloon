from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant, require_active_subscription, require_feature, require_roles
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.branch import Branch
from app.models.subscription import SubscriptionPlan

router = APIRouter(prefix="/branches", tags=["Branch Management"])

class BranchCreate(BaseModel):
    name: str
    code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: str = "Satara"
    state: str = "Maharashtra"
    pincode: str = "415002"
    is_main: bool = False

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("")
def list_branches(
    tenant: Tenant = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Lists branches for the authenticated salon."""
    return db.query(Branch).filter(Branch.tenant_id == tenant.id).order_by(Branch.is_main.desc(), Branch.name.asc()).all()

@router.post("")
def create_branch(
    payload: BranchCreate,
    tenant: Tenant = Depends(require_feature("multi_branch")),
    current_user: User = Depends(require_roles(UserRole.OWNER, UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Creates a new branch for the salon.
    Gated to Business plan with up to 3 branches.
    """
    if tenant.subscription_plan_id:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant.subscription_plan_id).first()
        if plan and plan.branch_limit:
            count = db.query(Branch).filter(Branch.tenant_id == tenant.id).count()
            if count >= plan.branch_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Branch limit reached ({count}/{plan.branch_limit}). Cloud Salon {plan.plan_name} allows up to {plan.branch_limit} branch(es). Upgrade to add more locations."
                )

    existing = db.query(Branch).filter(Branch.tenant_id == tenant.id, Branch.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A branch with this name already exists in this salon.")

    branch = Branch(
        tenant_id=tenant.id,
        name=payload.name.strip(),
        code=payload.code,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        is_main=payload.is_main,
        is_active=True
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch

@router.put("/{branch_id}")
def update_branch(
    branch_id: str,
    payload: BranchUpdate,
    tenant: Tenant = Depends(require_active_subscription),
    current_user: User = Depends(require_roles(UserRole.OWNER, UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    branch = db.query(Branch).filter(Branch.tenant_id == tenant.id, Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found.")

    if payload.name is not None:
        branch.name = payload.name.strip()
    if payload.code is not None:
        branch.code = payload.code
    if payload.phone is not None:
        branch.phone = payload.phone
    if payload.email is not None:
        branch.email = payload.email
    if payload.address is not None:
        branch.address = payload.address
    if payload.city is not None:
        branch.city = payload.city
    if payload.state is not None:
        branch.state = payload.state
    if payload.pincode is not None:
        branch.pincode = payload.pincode
    if payload.is_active is not None:
        branch.is_active = payload.is_active

    db.commit()
    db.refresh(branch)
    return branch

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, get_password_hash
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.subscription import SubscriptionPlan
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, UserResponse, UserCreate

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Unified Login endpoint for Cloud Technologies Super Admin and Salon Users.
    Resolves tenant context server-side.
    """
    # 1. Check if user is Super Admin
    super_admin = db.query(User).filter(
        User.email == request.email.lower().strip(),
        User.role.in_([UserRole.PLATFORM_SUPER_ADMIN.value, UserRole.SUPER_ADMIN.value]),
        User.is_active == True
    ).first()

    if super_admin:
        if not verify_password(request.password, super_admin.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials for platform administrator."
            )
        
        access_token = create_access_token({
            "sub": super_admin.id,
            "tenant_id": None,
            "role": super_admin.role
        })
        refresh_token = create_refresh_token({
            "sub": super_admin.id,
            "tenant_id": None
        })

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.model_validate(super_admin)
        )

    # 2. Salon User Authentication
    query = db.query(User).filter(
        User.email == request.email.lower().strip(),
        User.is_active == True
    )
    if request.tenant_id:
        query = query.filter(User.tenant_id == request.tenant_id.strip())

    user = query.first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Verify salon tenant status
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned salon organization does not exist."
        )
    if not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Salon account '{tenant.name}' has been deactivated."
        )

    access_token = create_access_token({
        "sub": user.id,
        "tenant_id": user.tenant_id,
        "role": user.role
    })
    refresh_token = create_refresh_token({
        "sub": user.id,
        "tenant_id": user.tenant_id
    })

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")
        
    new_access_token = create_access_token({"sub": user.id, "tenant_id": user.tenant_id, "role": user.role})
    new_refresh_token = create_refresh_token({"sub": user.id, "tenant_id": user.tenant_id})
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/users", response_model=UserResponse)
def create_tenant_user(
    req: UserCreate,
    current_user: User = Depends(require_roles(UserRole.OWNER, UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """
    Creates a new staff/employee account for the authenticated salon.
    Enforces subscription plan staff limits (Owner is excluded from the limit).
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Salon tenant not found.")

    # Check staff limit based on subscription plan
    if tenant.subscription_plan_id:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant.subscription_plan_id).first()
        if plan and plan.staff_limit:
            # Count staff accounts excluding OWNER
            existing_staff_count = db.query(User).filter(
                User.tenant_id == current_user.tenant_id,
                User.role.notin_([UserRole.SALON_OWNER.value, UserRole.OWNER.value]),
                User.is_active == True
            ).count()

            if existing_staff_count >= plan.staff_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Staff limit reached ({existing_staff_count}/{plan.staff_limit}). Cloud Salon {plan.plan_name} allows up to {plan.staff_limit} staff accounts (excluding owner). Upgrade to Cloud Salon Business for unlimited staff accounts."
                )

    existing = db.query(User).filter(User.tenant_id == current_user.tenant_id, User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists in this salon.")
        
    new_user = User(
        tenant_id=current_user.tenant_id,
        email=req.email.lower().strip(),
        phone=req.phone,
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse.model_validate(new_user)

from datetime import datetime, timezone
from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.subscription import SubscriptionPlan

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Decodes the server-signed JWT access token and resolves the authenticated user.
    Never trusts client headers for user identity.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials from token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token does not exist.",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact your salon administrator.",
        )
    
    return user

def get_current_tenant_id(
    current_user: User = Depends(get_current_user)
) -> str:
    """
    STRICT MULTI-TENANT ISOLATION:
    Tenant ID is resolved strictly from the authenticated user's trusted server-side identity.
    Never trusts client-supplied X-Tenant-ID headers for data routing.
    
    SUPER ADMIN PRIVACY FIREWALL:
    Platform Super Admins (tenant_id is None) are strictly blocked from accessing
    private salon operational endpoints.
    """
    if current_user.role in (UserRole.PLATFORM_SUPER_ADMIN.value, UserRole.SUPER_ADMIN.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privacy Firewall: Platform Super Admin cannot access private salon operational data."
        )
    
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any salon tenant."
        )
    
    return current_user.tenant_id

def get_current_tenant(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
) -> Tenant:
    """Fetches the salon tenant record for the authenticated salon user."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salon tenant '{tenant_id}' not found."
        )
    if not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Salon '{tenant.name}' account is deactivated."
        )
    return tenant

def require_active_subscription(
    tenant: Tenant = Depends(get_current_tenant)
) -> Tenant:
    """
    SUBSCRIPTION LIFECYCLE ENFORCEMENT:
    Ensures that the salon's account is ACTIVE or in a valid TRIAL period.
    Blocks access if SUSPENDED, CANCELLED or EXPIRED with clear renewal messages.
    """
    if tenant.subscription_status in ("SUSPENDED", "CANCELLED"):
        reason = f" Reason: {tenant.suspension_reason}" if tenant.suspension_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Salon account is currently suspended.{reason} Please contact Cloud Technologies support."
        )
    
    now = datetime.now(timezone.utc)
    if tenant.subscription_end_date and tenant.subscription_end_date < now:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your Cloud Salon subscription expired on {tenant.subscription_end_date.strftime('%d-%b-%Y')}. Please renew your subscription to resume billing and appointment operations."
        )
    
    return tenant

def require_feature(feature_key: str) -> Callable:
    """
    SUBSCRIPTION FEATURE GATING:
    Verifies that the salon's active plan includes the requested feature.
    If on Professional and accessing Business-only features (e.g. advanced commissions, packages),
    returns an upgrade prompt with ₹1,799/month pricing.
    """
    def feature_checker(
        tenant: Tenant = Depends(require_active_subscription),
        db: Session = Depends(get_db)
    ) -> Tenant:
        if not tenant.subscription_plan_id:
            return tenant
            
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant.subscription_plan_id).first()
        if not plan or not plan.feature_configuration:
            return tenant
            
        features = plan.feature_configuration or {}
        if not features.get(feature_key, False):
            display_name = feature_key.replace("_", " ").title()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{display_name} is available exclusively in Cloud Salon Business. Upgrade to ₹1,799/month to unlock this feature."
            )
        return tenant
    return feature_checker

def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Enforces exclusive Cloud Technologies Super Admin access."""
    if current_user.role not in (UserRole.PLATFORM_SUPER_ADMIN.value, UserRole.SUPER_ADMIN.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Cloud Technologies Platform Super Admin privileges required."
        )
    return current_user

def require_roles(*allowed_roles: UserRole):
    """Enforces role-based access control (RBAC) within a salon."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role
        allowed_str = set()
        for r in allowed_roles:
            val = r.value if isinstance(r, UserRole) else str(r)
            allowed_str.add(val)
            if val in ("SALON_OWNER", "OWNER"):
                allowed_str.update(["SALON_OWNER", "OWNER"])
            elif val in ("SALON_MANAGER", "MANAGER"):
                allowed_str.update(["SALON_MANAGER", "MANAGER"])
            elif val in ("SALON_RECEPTIONIST", "RECEPTIONIST"):
                allowed_str.update(["SALON_RECEPTIONIST", "RECEPTIONIST"])
            elif val in ("SALON_BEAUTICIAN", "BEAUTICIAN"):
                allowed_str.update(["SALON_BEAUTICIAN", "BEAUTICIAN"])
            elif val in ("SALON_CASHIER", "CASHIER"):
                allowed_str.update(["SALON_CASHIER", "CASHIER"])
            elif val in ("SALON_INVENTORY_MANAGER", "INVENTORY_MANAGER"):
                allowed_str.update(["SALON_INVENTORY_MANAGER", "INVENTORY_MANAGER"])

        if user_role not in allowed_str and user_role not in (UserRole.SALON_OWNER.value, UserRole.OWNER.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: This action requires one of the following roles: {list(allowed_str)}."
            )
        return current_user
    return role_checker

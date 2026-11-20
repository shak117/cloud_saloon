from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_tenant_id, get_current_tenant, require_roles
from app.models.user import UserRole
from app.models.tenant import Tenant
from app.schemas.tenant import TenantResponse, TenantUpdate
from app.services.demo_seeder import reset_demo_tenant
from app.models.subscription import SubscriptionPlan

router = APIRouter(prefix="/settings", tags=["Salon Settings"])

@router.get("/subscription")
def get_salon_subscription(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Returns the authenticated salon's current subscription details and limits."""
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tenant.subscription_plan_id).first()
    return {
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "subscription_status": tenant.subscription_status,
        "plan_name": plan.plan_name if plan else "Professional",
        "plan_code": plan.code if plan else "PROFESSIONAL",
        "monthly_price": float(plan.monthly_price) if plan else 999.00,
        "branch_limit": plan.branch_limit if plan else 1,
        "staff_limit": plan.staff_limit if plan else 3,
        "features": plan.feature_configuration if plan else {},
        "subscription_start_date": tenant.subscription_start_date.isoformat() if tenant.subscription_start_date else None,
        "subscription_end_date": tenant.subscription_end_date.isoformat() if tenant.subscription_end_date else None,
        "is_active": tenant.is_active,
        "renewal_support_contact": {
            "company": "Cloud Technologies",
            "phone": "+91 9822000000",
            "email": "billing@cloudtechnologies.in",
            "upi_id": "cloudtechnologies@upi"
        }
    }

@router.get("/profile", response_model=TenantResponse)
def get_tenant_profile(tenant: Tenant = Depends(get_current_tenant)):
    return tenant

@router.put("/profile", response_model=TenantResponse)
def update_tenant_profile(
    req: TenantUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(tenant, k, v)
        
    db.commit()
    db.refresh(tenant)
    return tenant

@router.get("/whatsapp-templates")
def get_whatsapp_templates(tenant: Tenant = Depends(get_current_tenant)):
    """Pre-configured official WhatsApp Business message templates."""
    return {
        "provider": "WhatsApp Business Cloud API (Official Meta Graph API)",
        "status": "Configured / Ready",
        "phone_number_id": "10492847291049",
        "templates": [
            {
                "id": "appointment_confirmation",
                "name": "Appointment Confirmation",
                "sample": f"Dear {{1}}, your appointment at {tenant.name} for {{2}} on {{3}} at {{4}} with stylist {{5}} is confirmed! Location: {tenant.address or 'Satara'}. Need to reschedule? Reply to this message.",
                "variables": ["Client Name", "Service Name", "Date", "Time", "Stylist Name"]
            },
            {
                "id": "appointment_reminder",
                "name": "Appointment Reminder (2h Prior)",
                "sample": f"Hi {{1}}! Quick reminder for your upcoming session at {tenant.name} today at {{2}} with {{3}}. See you soon! Tel: {tenant.phone}",
                "variables": ["Client Name", "Time", "Stylist Name"]
            },
            {
                "id": "payment_receipt",
                "name": "Digital Receipt & Feedback",
                "sample": f"Thank you for visiting {tenant.name}! Your bill {{1}} of â‚¹{{2}} was received successfully via {{3}}. View invoice: {{4}}. We hope you loved your look! âœ¨",
                "variables": ["Invoice Number", "Amount", "Payment Mode", "PDF Link"]
            }
        ]
    }

@router.post("/demo/reset")
def reset_demo_data(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    """
    Safely resets the pilot demo tenant (SK Relax Studio).
    Protected against resetting real production tenants.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant or not tenant.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reset operation is strictly restricted to designated demo tenants."
        )
        
    reset_demo_tenant(db, tenant_id)
    return {"message": f"Successfully reset demo tenant '{tenant.name}' to fresh pilot state."}

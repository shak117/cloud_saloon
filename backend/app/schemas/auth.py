from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    full_name: str
    password: str
    role: str = "RECEPTIONIST"

class UserResponse(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    email: str
    phone: Optional[str] = None
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.services.demo_seeder import seed_demo_tenant
from app.api import (
    auth, dashboard, services, customers, appointments,
    pos, staff, packages, inventory, expenses, reports, settings as settings_api,
    super_admin, branches
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cloud_salon")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Cloud Salon PostgreSQL schema...")
    init_db()
    
    # Auto-seed pilot tenant (SK Relax Studio) if not already present
    db = SessionLocal()
    try:
        seed_demo_tenant(db, settings.PILOT_TENANT_ID)
    finally:
        db.close()
        
    yield
    logger.info("Cloud Salon API shutting down cleanly.")

is_prod = settings.ENVIRONMENT.lower() == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Cloud Salon — Premium Multi-Tenant Salon Billing & Management SaaS by Cloud Technologies",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# CORS middleware for React Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],  # Permits local dev preview on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(dashboard.router, prefix=api_v1_prefix)
app.include_router(appointments.router, prefix=api_v1_prefix)
app.include_router(pos.router, prefix=api_v1_prefix)
app.include_router(services.router, prefix=api_v1_prefix)
app.include_router(customers.router, prefix=api_v1_prefix)
app.include_router(staff.router, prefix=api_v1_prefix)
app.include_router(packages.router, prefix=api_v1_prefix)
app.include_router(inventory.router, prefix=api_v1_prefix)
app.include_router(expenses.router, prefix=api_v1_prefix)
app.include_router(reports.router, prefix=api_v1_prefix)
app.include_router(settings_api.router, prefix=api_v1_prefix)
app.include_router(branches.router, prefix=api_v1_prefix)
app.include_router(super_admin.router, prefix=api_v1_prefix)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/")
def root():
    return {
        "product": "Cloud Salon",
        "company": "Cloud Technologies",
        "docs_url": "/docs",
        "api_v1": "/api/v1",
        "pilot_tenant": "SK Relax Studio, Satara"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

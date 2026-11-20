import logging
from sqlalchemy import text
from app.core.database import engine, Base
import app.models  # Ensure all models are registered

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cloud_salon.migration")

def apply_multitenancy_migration():
    logger.info("Applying multi-tenancy schema migration to PostgreSQL...")
    
    with engine.connect() as conn:
        # 1. Add new columns to 'tenants' table if they do not exist
        conn.execute(text("""
            ALTER TABLE salon.tenants 
            ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) DEFAULT 'SALON_AND_SPA' NOT NULL,
            ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata' NOT NULL,
            ADD COLUMN IF NOT EXISTS subscription_plan_id VARCHAR(36),
            ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
            ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
            ADD COLUMN IF NOT EXISTS tax_configuration JSON;
        """))
        
        # 2. Make tenant_id nullable in 'users' table (for SUPER_ADMIN)
        conn.execute(text("""
            ALTER TABLE salon.users 
            ALTER COLUMN tenant_id DROP NOT NULL;
        """))

        # 3. Add columns to 'subscription_plans' if needed
        conn.execute(text("""
            ALTER TABLE salon.subscription_plans 
            ADD COLUMN IF NOT EXISTS code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS setup_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
            ADD COLUMN IF NOT EXISTS branch_limit INTEGER DEFAULT 1 NOT NULL,
            ADD COLUMN IF NOT EXISTS staff_limit INTEGER DEFAULT 3 NOT NULL,
            ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14 NOT NULL;
        """))

        # 4. Add columns to 'subscriptions' if needed
        conn.execute(text("""
            ALTER TABLE salon.subscriptions 
            ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
            ADD COLUMN IF NOT EXISTS notes TEXT;
        """))
        
        conn.commit()

    # Create any new tables (branches, etc.)
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        # Scoped unique indexes
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_tenant_mobile 
            ON salon.customers (tenant_id, mobile);
        """))
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_users_tenant_email 
            ON salon.users (tenant_id, email) 
            WHERE tenant_id IS NOT NULL;
        """))
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_super_admin_email 
            ON salon.users (email) 
            WHERE tenant_id IS NULL;
        """))
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_branches_tenant_name 
            ON salon.branches (tenant_id, name);
        """))
        conn.commit()
        logger.info("Multi-tenancy schema migration completed successfully!")

if __name__ == "__main__":
    apply_multitenancy_migration()

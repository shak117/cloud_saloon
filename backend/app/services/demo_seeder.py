import logging
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.staff import Staff, CommissionType
from app.models.service import ServiceCategory, Service
from app.models.customer import Customer
from app.models.appointment import Appointment, AppointmentStatus
from app.models.invoice import Invoice, InvoiceItem, Payment, InvoiceType, PaymentStatus, PaymentMethod, ItemType
from app.models.package import Package, CustomerPackage, PackageRedemption, CustomerPackageStatus
from app.models.product import (
    ProductCategory, Product, ProductType, ProductUnit,
    StockTransactionType, ServiceRecipe, StockLedger
)
from app.models.expense import Expense, ExpenseCategory
from app.models.commission import StaffCommission
from app.models.audit import AuditLog
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.platform_audit import PlatformAuditLog
from app.models.branch import Branch

logger = logging.getLogger("cloud_salon.seeder")

def seed_platform_defaults(db: Session):
    """Seeds official two subscription plans and Cloud Technologies Super Admin."""
    plans_data = [
        {
            "id": "plan-professional",
            "plan_name": "Professional",
            "code": "PROFESSIONAL",
            "description": "Essential single-location salon management with up to 3 staff members, fast B2C billing, appointments, and inventory tracking.",
            "monthly_price": Decimal("999.00"),
            "setup_fee": Decimal("1999.00"),
            "annual_price": Decimal("9999.00"),
            "branch_limit": 1,
            "staff_limit": 3,
            "trial_days": 14,
            "user_limit": 4,
            "feature_configuration": {
                "dashboard": True,
                "pos_billing": True,
                "appointments": True,
                "customers": True,
                "customer_history": True,
                "service_catalogue": True,
                "service_prices": True,
                "invoice_printing": True,
                "payment_tracking": True,
                "partial_payments": True,
                "daily_reports": True,
                "monthly_reports": True,
                "basic_expenses": True,
                "basic_inventory": True,
                "multi_branch": False,
                "advanced_commissions": False,
                "memberships": False,
                "packages": False,
                "advanced_inventory": False,
                "purchases": False,
                "staff_analytics": False,
                "advanced_reports": False
            },
            "status": "ACTIVE"
        },
        {
            "id": "plan-business",
            "plan_name": "Business",
            "code": "BUSINESS",
            "description": "Comprehensive multi-branch operations for growing salons & studios: up to 3 branches, unlimited staff, advanced commissions, packages & analytics.",
            "monthly_price": Decimal("1799.00"),
            "setup_fee": Decimal("2999.00"),
            "annual_price": Decimal("17999.00"),
            "branch_limit": 3,
            "staff_limit": 999,  # Unlimited staff accounts
            "trial_days": 14,
            "user_limit": 100,
            "feature_configuration": {
                "dashboard": True,
                "pos_billing": True,
                "appointments": True,
                "customers": True,
                "customer_history": True,
                "service_catalogue": True,
                "service_prices": True,
                "invoice_printing": True,
                "payment_tracking": True,
                "partial_payments": True,
                "daily_reports": True,
                "monthly_reports": True,
                "basic_expenses": True,
                "basic_inventory": True,
                "multi_branch": True,
                "advanced_commissions": True,
                "memberships": True,
                "packages": True,
                "advanced_inventory": True,
                "purchases": True,
                "staff_analytics": True,
                "advanced_reports": True,
                "priority_support": True
            },
            "status": "ACTIVE"
        }
    ]

    for pdata in plans_data:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == pdata["id"]).first()
        if not plan:
            plan = SubscriptionPlan(**pdata)
            db.add(plan)
            logger.info(f"Seeded official plan: {pdata['plan_name']}")
        else:
            plan.monthly_price = pdata["monthly_price"]
            plan.setup_fee = pdata["setup_fee"]
            plan.annual_price = pdata["annual_price"]
            plan.branch_limit = pdata["branch_limit"]
            plan.staff_limit = pdata["staff_limit"]
            plan.trial_days = pdata["trial_days"]
            plan.feature_configuration = pdata["feature_configuration"]
            plan.status = "ACTIVE"
    db.flush()

    # Seed Cloud Technologies Super Admin
    super_admin_email = "admin@cloudtechnologies.in"
    super_admin = db.query(User).filter(User.email == super_admin_email).first()
    if not super_admin:
        super_admin = User(
            id="super-admin-cloudtech-001",
            tenant_id=None,
            email=super_admin_email,
            full_name="Cloud Technologies Administrator",
            role=UserRole.PLATFORM_SUPER_ADMIN.value,
            hashed_password=get_password_hash("CloudAdmin@2026"),
            phone="+91 9822000000",
            is_active=True
        )
        db.add(super_admin)
        logger.info(f"Seeded Super Admin user: {super_admin_email}")
    else:
        super_admin.role = UserRole.PLATFORM_SUPER_ADMIN.value
    db.flush()

def seed_demo_tenant(db: Session, tenant_id: str = "sk-relax-satara") -> Tenant:
    """Seeds the official SK Relax Studio pilot tenant and authentic salon records."""
    seed_platform_defaults(db)

    now = datetime.now(timezone.utc)
    biz_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == "plan-business").first()
    
    # 1. Tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        tenant = Tenant(
            id=tenant_id,
            name="SK Relax Studio",
            slug="sk-relax",
            business_type="HAIR_AND_BEAUTY_SALON",
            owner_name="Salma Attar",
            legal_name="SK Relax Beauty Academy & Salon",
            gstin="27AAACS1234F1Z5",
            pan="AAACS1234F",
            phone="+91 8459890270",
            email="contact@skrelax.com",
            address="6, Rajwada Cir, near IDBI Bank, Pratapganj Peth",
            city="Satara",
            state="Maharashtra",
            state_code="27",
            pincode="415002",
            currency="INR",
            timezone="Asia/Kolkata",
            subscription_plan_id=biz_plan.id if biz_plan else None,
            subscription_status="ACTIVE",
            subscription_start_date=now - timedelta(days=30),
            subscription_end_date=now + timedelta(days=335),
            tax_configuration={
                "gst_enabled": False,  # Non-GST simple launch mode by default
                "gst_rate": 0.0,
                "cgst_rate": 0.0,
                "sgst_rate": 0.0,
                "composition_scheme": False
            },
            opening_time="10:00",
            closing_time="20:00",
            default_appointment_duration=30,
            invoice_prefix="SKR-",
            invoice_sequence=1042,
            thermal_header="SK RELAX BEAUTY ACADEMY & SALON\n6, Rajwada Circle, Satara\nTel: +91 8459890270",
            thermal_footer="Thank you for choosing SK Relax Studio!\nFor appointments: WhatsApp +91 8459890270",
            is_demo=True,
            is_active=True
        )
        db.add(tenant)
        db.flush()
    else:
        # Update existing pilot tenant attributes
        tenant.owner_name = "Salma Attar"
        tenant.business_type = "HAIR_AND_BEAUTY_SALON"
        tenant.subscription_plan_id = biz_plan.id if biz_plan else None
        tenant.subscription_status = "ACTIVE"
        if not tenant.subscription_start_date:
            tenant.subscription_start_date = now - timedelta(days=30)
        if not tenant.subscription_end_date:
            tenant.subscription_end_date = now + timedelta(days=335)
        # Simple non-GST mode by default
        tenant.tax_configuration = {
            "gst_enabled": False,
            "gst_rate": 0.0,
            "cgst_rate": 0.0,
            "sgst_rate": 0.0,
            "composition_scheme": False
        }
        db.flush()

    # Seed Default Branch for SK Relax Studio
    main_branch = db.query(Branch).filter(Branch.tenant_id == tenant_id).first()
    if not main_branch:
        main_branch = Branch(
            id="branch-sk-relax-main",
            tenant_id=tenant_id,
            name="Rajwada Circle (Main Branch)",
            code="MAIN",
            phone="+91 8459890270",
            email="contact@skrelax.com",
            address="6, Rajwada Cir, near IDBI Bank, Pratapganj Peth",
            city="Satara",
            state="Maharashtra",
            pincode="415002",
            is_main=True,
            is_active=True
        )
        db.add(main_branch)
        db.flush()

    # Active Subscription Record for SK Relax Studio
    sub = db.query(Subscription).filter(Subscription.salon_id == tenant_id).first()
    if not sub and biz_plan:
        sub = Subscription(
            id="sub-sk-relax-pilot",
            salon_id=tenant_id,
            plan_id=biz_plan.id,
            start_date=now - timedelta(days=30),
            end_date=now + timedelta(days=335),
            billing_cycle="MONTHLY",
            amount=Decimal("1799.00"),
            payment_status="PAID",
            subscription_status="ACTIVE",
            notes="Pilot Launch Subscription"
        )
        db.add(sub)
        db.flush()
    elif sub and biz_plan:
        sub.plan_id = biz_plan.id
        sub.amount = Decimal("1799.00")
        sub.subscription_status = "ACTIVE"
        db.flush()

    # 2. Users (Owner, Manager, Receptionist, Beautician)
    users_data = [
        ("salma@skrelax.com", "Salma Attar", UserRole.SALON_OWNER.value, "Salma@2026"),
        ("manager@skrelax.com", "Deepak Shinde", UserRole.SALON_MANAGER.value, "Manager@2026"),
        ("reception@skrelax.com", "Kavita More", UserRole.SALON_RECEPTIONIST.value, "Reception@2026"),
        ("stylist@skrelax.com", "Pooja Shinde", UserRole.SALON_BEAUTICIAN.value, "Stylist@2026"),
    ]
    user_map = {}
    for email, full_name, role_val, password in users_data:
        user = db.query(User).filter(User.tenant_id == tenant_id, User.email == email).first()
        if not user:
            user = User(
                tenant_id=tenant_id,
                email=email,
                phone="+91 8459890270",
                full_name=full_name,
                hashed_password=get_password_hash(password),
                role=role_val,
                is_active=True
            )
            db.add(user)
            db.flush()
        else:
            if user.role != role_val:
                user.role = role_val
                db.flush()
        user_map[email] = user

    # 3. Staff Roster
    staff_data = [
        ("Salma Attar", "+91 8459890270", "salma@skrelax.com", "Master Aesthetician & Hair Artist", "Hair & Skin Aesthetics", "#C5A059", CommissionType.PERCENTAGE.value, Decimal("15.0")),
        ("Pooja Shinde", "+91 9822101011", "pooja@skrelax.com", "Senior Hair Stylist", "Haircuts, Keratin, Botox", "#9C7A5B", CommissionType.PERCENTAGE.value, Decimal("10.0")),
        ("Sneha Patil", "+91 9822101012", "sneha@skrelax.com", "Skin Specialist", "Hydra-Facials & Cleanups", "#B76E79", CommissionType.PERCENTAGE.value, Decimal("10.0")),
        ("Tanvi Jadhav", "+91 9822101013", "tanvi@skrelax.com", "Nail & Makeup Artist", "Bridal & Nails", "#8E44AD", CommissionType.PERCENTAGE.value, Decimal("10.0")),
        ("Rahul Kadam", "+91 9822101014", "rahul@skrelax.com", "Massage & Spa Therapist", "Head Massage & Body Spa", "#27AE60", CommissionType.FIXED.value, Decimal("100.0")),
        ("Kavita More", "+91 9822101015", "kavita@skrelax.com", "Front Desk Receptionist", "Billing & Appointments", "#2C3E50", CommissionType.NONE.value, Decimal("0.0")),
    ]
    staff_map = {}
    for name, mob, eml, desig, spec, col, comm_t, comm_r in staff_data:
        staff_member = db.query(Staff).filter(Staff.tenant_id == tenant_id, Staff.name == name).first()
        if not staff_member:
            staff_member = Staff(
                tenant_id=tenant_id,
                name=name,
                mobile=mob,
                email=eml,
                designation=desig,
                specialization=spec,
                color_code=col,
                commission_type=comm_t,
                commission_rate=comm_r,
                working_hours_start="10:00",
                working_hours_end="20:00",
                is_active=True
            )
            db.add(staff_member)
            db.flush()
        staff_map[name] = staff_member

    # 4. Service Categories
    cat_data = [
        ("Hair", "Hair cuts, styling, spa, keratin, nanoplastia and colors", 1),
        ("Skin", "Hydra-facials, Korean glass skin, cleanups and dermabrasion", 2),
        ("Beauty", "Manicure, pedicure, threading, waxing and party makeup", 3),
        ("Spa", "Relaxing head massage, body spa and aromatherapy", 4),
    ]
    category_map = {}
    for cat_name, desc, order in cat_data:
        category = db.query(ServiceCategory).filter(ServiceCategory.tenant_id == tenant_id, ServiceCategory.name == cat_name).first()
        if not category:
            category = ServiceCategory(
                tenant_id=tenant_id,
                name=cat_name,
                description=desc,
                display_order=order,
                is_active=True
            )
            db.add(category)
            db.flush()
        category_map[cat_name] = category

    # 5. Service Catalog
    services_data = [
        ("Hair", "Precision Haircut & Styling", Decimal("450.00"), 30, "999721", Decimal("18.00")),
        ("Hair", "L'OrÃ©al Deep Nourishing Hair Spa", Decimal("1200.00"), 45, "999721", Decimal("18.00")),
        ("Hair", "Keratin Smoothing Treatment", Decimal("3500.00"), 90, "999721", Decimal("18.00")),
        ("Hair", "Nanoplastia Hair Botox Treatment", Decimal("4500.00"), 120, "999721", Decimal("18.00")),
        ("Hair", "Global Hair Colour & Highlights", Decimal("3200.00"), 90, "999721", Decimal("18.00")),
        
        ("Skin", "Hydra-Facial MD Deep Pore Infusion", Decimal("3500.00"), 60, "999722", Decimal("18.00")),
        ("Skin", "Korean Glass Skin Facial Treatment", Decimal("4200.00"), 75, "999722", Decimal("18.00")),
        ("Skin", "O3+ Bridal Radiant Glow Facial", Decimal("2200.00"), 60, "999722", Decimal("18.00")),
        ("Skin", "Express Herbal Cleanup & D-Tan", Decimal("650.00"), 30, "999722", Decimal("18.00")),
        
        ("Beauty", "Luxury Rose Manicure & Pedicure", Decimal("1200.00"), 50, "999722", Decimal("18.00")),
        ("Beauty", "HD Bridal Makeup & Saree Draping", Decimal("12000.00"), 150, "999722", Decimal("18.00")),
        ("Beauty", "Party Glam Makeup & Hair Do", Decimal("2500.00"), 60, "999722", Decimal("18.00")),
        
        ("Spa", "Aromatherapy Deep Relaxation Body Spa", Decimal("2800.00"), 60, "999723", Decimal("18.00")),
        ("Spa", "Ayurvedic Herbal Head & Shoulder Massage", Decimal("550.00"), 30, "999723", Decimal("18.00")),
    ]
    service_map = {}
    for cat_name, serv_name, price, dur, sac, gst in services_data:
        service = db.query(Service).filter(Service.tenant_id == tenant_id, Service.name == serv_name).first()
        if not service:
            service = Service(
                tenant_id=tenant_id,
                category_id=category_map[cat_name].id,
                name=serv_name,
                price=price,
                duration_minutes=dur,
                sac_code=sac,
                gst_rate=gst,
                is_commission_eligible=True,
                is_active=True
            )
            db.add(service)
            db.flush()
        service_map[serv_name] = service

    # 6. Product Categories & Products (Retail vs Consumable)
    prod_cat = db.query(ProductCategory).filter(ProductCategory.tenant_id == tenant_id, ProductCategory.name == "Hair & Skin Care").first()
    if not prod_cat:
        prod_cat = ProductCategory(
            tenant_id=tenant_id,
            name="Hair & Skin Care",
            description="Professional salon products and treatment consumables"
        )
        db.add(prod_cat)
        db.flush()

    products_data = [
        (ProductType.RETAIL.value, "L'OrÃ©al Absolut Repair Shampoo (500ml)", "L'OrÃ©al", ProductUnit.BOTTLE.value, Decimal("650.00"), Decimal("850.00"), Decimal("24.0"), Decimal("5.0")),
        (ProductType.RETAIL.value, "Moroccan Argan Hair Treatment Serum (100ml)", "Moroccanoil", ProductUnit.BOTTLE.value, Decimal("1100.00"), Decimal("1450.00"), Decimal("18.0"), Decimal("4.0")),
        (ProductType.RETAIL.value, "O3+ Dermashine Vitamin C Glow Serum (50ml)", "O3+", ProductUnit.BOTTLE.value, Decimal("850.00"), Decimal("1150.00"), Decimal("12.0"), Decimal("3.0")),
        
        # Consumables
        (ProductType.CONSUMABLE.value, "O3+ Professional Facial Creambath (1000g)", "O3+", ProductUnit.GRAM.value, Decimal("1800.00"), Decimal("0.00"), Decimal("850.0"), Decimal("200.0")),
        (ProductType.CONSUMABLE.value, "L'OrÃ©al Creambath Hair Spa Base (1000g)", "L'OrÃ©al", ProductUnit.GRAM.value, Decimal("1400.00"), Decimal("0.00"), Decimal("920.0"), Decimal("250.0")),
        (ProductType.CONSUMABLE.value, "Hydra-Facial Active Infusion Serum Kit", "Dermashine", ProductUnit.PIECE.value, Decimal("1200.00"), Decimal("0.00"), Decimal("14.0"), Decimal("5.0")),
        (ProductType.CONSUMABLE.value, "Disposable Hygiene Bed Sheets (Pack of 100)", "SafeTouch", ProductUnit.PIECE.value, Decimal("450.00"), Decimal("0.00"), Decimal("65.0"), Decimal("20.0")),
    ]
    product_map = {}
    for p_type, p_name, brand, unit, p_price, r_price, stock, reorder in products_data:
        prod = db.query(Product).filter(Product.tenant_id == tenant_id, Product.name == p_name).first()
        if not prod:
            prod = Product(
                tenant_id=tenant_id,
                category_id=prod_cat.id,
                product_type=p_type,
                name=p_name,
                brand=brand,
                unit=unit,
                purchase_price=p_price,
                retail_price=r_price,
                hsn_code="330510",
                gst_rate=Decimal("18.00"),
                current_stock=stock,
                reorder_level=reorder,
                is_active=True
            )
            db.add(prod)
            db.flush()
        product_map[p_name] = prod

    # 7. Service Recipes
    recipe1 = db.query(ServiceRecipe).filter(
        ServiceRecipe.tenant_id == tenant_id,
        ServiceRecipe.service_id == service_map["L'OrÃ©al Deep Nourishing Hair Spa"].id
    ).first()
    if not recipe1 and "L'OrÃ©al Creambath Hair Spa Base (1000g)" in product_map:
        db.add(ServiceRecipe(
            tenant_id=tenant_id,
            service_id=service_map["L'OrÃ©al Deep Nourishing Hair Spa"].id,
            consumable_product_id=product_map["L'OrÃ©al Creambath Hair Spa Base (1000g)"].id,
            quantity_consumed=Decimal("40.0"),
            unit="GRAM"
        ))

    recipe2 = db.query(ServiceRecipe).filter(
        ServiceRecipe.tenant_id == tenant_id,
        ServiceRecipe.service_id == service_map["Hydra-Facial MD Deep Pore Infusion"].id
    ).first()
    if not recipe2 and "Hydra-Facial Active Infusion Serum Kit" in product_map:
        db.add(ServiceRecipe(
            tenant_id=tenant_id,
            service_id=service_map["Hydra-Facial MD Deep Pore Infusion"].id,
            consumable_product_id=product_map["Hydra-Facial Active Infusion Serum Kit"].id,
            quantity_consumed=Decimal("1.0"),
            unit="PIECE"
        ))

    # 8. Packages
    pkg1 = db.query(Package).filter(Package.tenant_id == tenant_id, Package.name == "Bridal Glow Series (5 Sessions)").first()
    if not pkg1:
        pkg1 = Package(
            tenant_id=tenant_id,
            name="Bridal Glow Series (5 Sessions)",
            description="5 sessions of premium facials, cleanups and glow therapy over 90 days",
            price=Decimal("9999.00"),
            total_sessions=5,
            validity_days=90,
            applicable_service_id=service_map["O3+ Bridal Radiant Glow Facial"].id,
            is_active=True
        )
        db.add(pkg1)
        db.flush()

    pkg2 = db.query(Package).filter(Package.tenant_id == tenant_id, Package.name == "Annual Hair Care Pass (6 Sessions)").first()
    if not pkg2:
        pkg2 = Package(
            tenant_id=tenant_id,
            name="Annual Hair Care Pass (6 Sessions)",
            description="6 sessions of L'OrÃ©al Deep Nourishing Hair Spa valid for 180 days",
            price=Decimal("5999.00"),
            total_sessions=6,
            validity_days=180,
            applicable_service_id=service_map["L'OrÃ©al Deep Nourishing Hair Spa"].id,
            is_active=True
        )
        db.add(pkg2)
        db.flush()

    # 9. Customers
    customers_data = [
        ("Priyanka Bhosale", "+91 9822334455", "priyanka.b@gmail.com", "Female", "VIP client, loves Hydra-facial", True),
        ("Anjali Deshmukh", "+91 9422001122", "anjali.d@gmail.com", "Female", "Prefers organic hair color", True),
        ("Kavita Kulkarni", "+91 9890123456", "kavita.k@gmail.com", "Female", "Regular haircut and hair spa", False),
        ("Rohit Shinde", "+91 9158778899", "rohit.s@gmail.com", "Male", "Monthly head massage & styling", False),
        ("Sayali Pawar", "+91 9604112233", "sayali.p@gmail.com", "Female", "Bridal package enrollee", True),
    ]
    customer_map = {}
    for c_name, mob, eml, gen, prefs, vip in customers_data:
        cust = db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.mobile == mob).first()
        if not cust:
            cust = Customer(
                tenant_id=tenant_id,
                full_name=c_name,
                mobile=mob,
                email=eml,
                gender=gen,
                preferences=prefs,
                vip_status=vip,
                total_spend=Decimal("0.0"),
                total_visits=0,
                is_active=True
            )
            db.add(cust)
            db.flush()
        customer_map[c_name] = cust

    # 10. Sample Invoices & POS Transactions
    today = date.today()
    inv_check = db.query(Invoice).filter(Invoice.tenant_id == tenant_id).first()
    if not inv_check:
        inv1 = Invoice(
            tenant_id=tenant_id,
            invoice_number="SKR-202611-1001",
            invoice_type=InvoiceType.B2C.value,
            customer_id=customer_map["Kavita Kulkarni"].id,
            customer_name="Kavita Kulkarni",
            customer_phone="+91 9890123456",
            subtotal=Decimal("1300.00"),
            discount_amount=Decimal("0.00"),
            taxable_amount=Decimal("1101.69"),
            cgst_amount=Decimal("99.15"),
            sgst_amount=Decimal("99.15"),
            igst_amount=Decimal("0.00"),
            total_amount=Decimal("1300.00"),
            paid_amount=Decimal("1300.00"),
            balance_amount=Decimal("0.00"),
            payment_status=PaymentStatus.PAID.value,
            notes="Walk-in service + retail purchase"
        )
        db.add(inv1)
        db.flush()

        item1 = InvoiceItem(
            tenant_id=tenant_id,
            invoice_id=inv1.id,
            item_type=ItemType.SERVICE.value,
            service_id=service_map["Precision Haircut & Styling"].id,
            staff_id=staff_map["Pooja Shinde"].id,
            item_name="Precision Haircut & Styling",
            hsn_sac="999721",
            quantity=Decimal("1.0"),
            unit_price=Decimal("450.00"),
            discount=Decimal("0.00"),
            taxable_value=Decimal("381.36"),
            gst_rate=Decimal("18.00"),
            cgst_amount=Decimal("34.32"),
            sgst_amount=Decimal("34.32"),
            total_amount=Decimal("450.00"),
            commission_amount=Decimal("45.00")
        )
        item2 = InvoiceItem(
            tenant_id=tenant_id,
            invoice_id=inv1.id,
            item_type=ItemType.PRODUCT.value,
            product_id=product_map["L'OrÃ©al Absolut Repair Shampoo (500ml)"].id,
            staff_id=staff_map["Pooja Shinde"].id,
            item_name="L'OrÃ©al Absolut Repair Shampoo (500ml)",
            hsn_sac="330510",
            quantity=Decimal("1.0"),
            unit_price=Decimal("850.00"),
            discount=Decimal("0.00"),
            taxable_value=Decimal("720.34"),
            gst_rate=Decimal("18.00"),
            cgst_amount=Decimal("64.83"),
            sgst_amount=Decimal("64.83"),
            total_amount=Decimal("850.00"),
            commission_amount=Decimal("0.00")
        )
        db.add_all([item1, item2])
        
        pay1 = Payment(
            tenant_id=tenant_id,
            invoice_id=inv1.id,
            amount=Decimal("850.00"),
            payment_method=PaymentMethod.UPI.value,
            transaction_reference="UPI/SKR/982233/01",
            notes="GooglePay"
        )
        pay2 = Payment(
            tenant_id=tenant_id,
            invoice_id=inv1.id,
            amount=Decimal("450.00"),
            payment_method=PaymentMethod.CASH.value,
            transaction_reference="CASH",
            notes="Counter cash"
        )
        db.add_all([pay1, pay2])

        inv2 = Invoice(
            tenant_id=tenant_id,
            invoice_number="SKR-202611-1002",
            invoice_type=InvoiceType.B2C.value,
            customer_id=customer_map["Priyanka Bhosale"].id,
            customer_name="Priyanka Bhosale",
            customer_phone="+91 9822334455",
            subtotal=Decimal("3500.00"),
            discount_amount=Decimal("0.00"),
            taxable_amount=Decimal("2966.10"),
            cgst_amount=Decimal("266.95"),
            sgst_amount=Decimal("266.95"),
            igst_amount=Decimal("0.00"),
            total_amount=Decimal("3500.00"),
            paid_amount=Decimal("3500.00"),
            balance_amount=Decimal("0.00"),
            payment_status=PaymentStatus.PAID.value,
            notes="VIP Hydra-facial session"
        )
        db.add(inv2)
        db.flush()

        item3 = InvoiceItem(
            tenant_id=tenant_id,
            invoice_id=inv2.id,
            item_type=ItemType.SERVICE.value,
            service_id=service_map["Hydra-Facial MD Deep Pore Infusion"].id,
            staff_id=staff_map["Sneha Patil"].id,
            item_name="Hydra-Facial MD Deep Pore Infusion",
            hsn_sac="999722",
            quantity=Decimal("1.0"),
            unit_price=Decimal("3500.00"),
            discount=Decimal("0.00"),
            taxable_value=Decimal("2966.10"),
            gst_rate=Decimal("18.00"),
            cgst_amount=Decimal("266.95"),
            sgst_amount=Decimal("266.95"),
            total_amount=Decimal("3500.00"),
            commission_amount=Decimal("350.00")
        )
        db.add(item3)

        pay3 = Payment(
            tenant_id=tenant_id,
            invoice_id=inv2.id,
            amount=Decimal("3500.00"),
            payment_method=PaymentMethod.CARD.value,
            transaction_reference="HDFC-POS-7741",
            notes="Visa Platinum"
        )
        db.add(pay3)

    # 11. Appointments for today's tablet grid view
    appt_check = db.query(Appointment).filter(Appointment.tenant_id == tenant_id).first()
    if not appt_check:
        appts_data = [
            ("APT-101", customer_map["Priyanka Bhosale"].id, "Priyanka Bhosale", "+91 9822334455", service_map["Hydra-Facial MD Deep Pore Infusion"].id, staff_map["Sneha Patil"].id, today, "11:00", "12:00", AppointmentStatus.COMPLETED.value),
            ("APT-102", customer_map["Sayali Pawar"].id, "Sayali Pawar", "+91 9604112233", service_map["Korean Glass Skin Facial Treatment"].id, staff_map["Salma Attar"].id, today, "12:30", "13:45", AppointmentStatus.IN_PROGRESS.value),
            ("APT-103", customer_map["Anjali Deshmukh"].id, "Anjali Deshmukh", "+91 9422001122", service_map["Nanoplastia Hair Botox Treatment"].id, staff_map["Pooja Shinde"].id, today, "14:00", "16:00", AppointmentStatus.CONFIRMED.value),
            ("APT-104", customer_map["Rohit Shinde"].id, "Rohit Shinde", "+91 9158778899", service_map["Ayurvedic Herbal Head & Shoulder Massage"].id, staff_map["Rahul Kadam"].id, today, "16:30", "17:00", AppointmentStatus.BOOKED.value),
            ("APT-105", None, "Aarti Shinde (Walk-in)", "+91 9822998877", service_map["Precision Haircut & Styling"].id, staff_map["Pooja Shinde"].id, today, "17:15", "17:45", AppointmentStatus.BOOKED.value),
        ]
        for num, c_id, c_name, c_ph, s_id, st_id, a_date, s_time, e_time, status_val in appts_data:
            db.add(Appointment(
                tenant_id=tenant_id,
                appointment_number=num,
                customer_id=c_id,
                customer_name=c_name,
                customer_phone=c_ph,
                service_id=s_id,
                staff_id=st_id,
                appointment_date=a_date,
                start_time=s_time,
                end_time=e_time,
                status=status_val,
                is_walkin=(c_id is None)
            ))

    # 12. Expenses
    exp_check = db.query(Expense).filter(Expense.tenant_id == tenant_id).first()
    if not exp_check:
        expenses_data = [
            ("Monthly Studio Rent (Rajwada Circle)", ExpenseCategory.RENT.value, Decimal("25000.00"), today - timedelta(days=5), PaymentMethod.BANK_TRANSFER.value, "Commercial shop lease payment"),
            ("MSEDCL Electricity Bill - Studio AC & Salon Units", ExpenseCategory.ELECTRICITY.value, Decimal("6450.00"), today - timedelta(days=3), PaymentMethod.UPI.value, "Electricity bill for studio"),
            ("Salon Consumable Supplies (Cotton, Foils, Wax Strips)", ExpenseCategory.SUPPLIES.value, Decimal("3200.00"), today - timedelta(days=2), PaymentMethod.CASH.value, "Consumable items replenishment"),
            ("Instagram & Meta Local Brand Campaigns", ExpenseCategory.MARKETING.value, Decimal("2500.00"), today - timedelta(days=1), PaymentMethod.UPI.value, "Meta advertising campaign in Satara area"),
        ]
        for title, cat_val, amt, e_date, p_meth_val, desc in expenses_data:
            db.add(Expense(
                tenant_id=tenant_id,
                title=title,
                category=cat_val,
                amount=amt,
                expense_date=e_date,
                payment_method=p_meth_val,
                description=desc
            ))

    db.commit()
    logger.info(f"Successfully seeded pilot tenant SK Relax Studio ({tenant_id}) with complete dataset.")
    return tenant

def reset_demo_tenant(db: Session, tenant_id: str = "sk-relax-satara"):
    """Safely resets the demo tenant without touching other tenants."""
    logger.warning(f"Resetting demo tenant {tenant_id}...")
    
    db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id).delete()
    db.query(StaffCommission).filter(StaffCommission.tenant_id == tenant_id).delete()
    db.query(Expense).filter(Expense.tenant_id == tenant_id).delete()
    db.query(StockLedger).filter(StockLedger.tenant_id == tenant_id).delete()
    db.query(ServiceRecipe).filter(ServiceRecipe.tenant_id == tenant_id).delete()
    db.query(Payment).filter(Payment.tenant_id == tenant_id).delete()
    db.query(InvoiceItem).filter(InvoiceItem.tenant_id == tenant_id).delete()
    db.query(Invoice).filter(Invoice.tenant_id == tenant_id).delete()
    db.query(Appointment).filter(Appointment.tenant_id == tenant_id).delete()
    db.query(PackageRedemption).filter(PackageRedemption.tenant_id == tenant_id).delete()
    db.query(CustomerPackage).filter(CustomerPackage.tenant_id == tenant_id).delete()
    db.query(Package).filter(Package.tenant_id == tenant_id).delete()
    db.query(Product).filter(Product.tenant_id == tenant_id).delete()
    db.query(ProductCategory).filter(ProductCategory.tenant_id == tenant_id).delete()
    db.query(Service).filter(Service.tenant_id == tenant_id).delete()
    db.query(ServiceCategory).filter(ServiceCategory.tenant_id == tenant_id).delete()
    db.query(Customer).filter(Customer.tenant_id == tenant_id).delete()
    db.query(Staff).filter(Staff.tenant_id == tenant_id).delete()
    db.query(User).filter(User.tenant_id == tenant_id).delete()
    db.query(Tenant).filter(Tenant.id == tenant_id).delete()
    db.commit()
    
    return seed_demo_tenant(db, tenant_id)

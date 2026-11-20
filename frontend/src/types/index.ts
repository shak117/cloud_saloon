export type UserRole = 
  | "PLATFORM_SUPER_ADMIN"
  | "SUPER_ADMIN"
  | "SALON_OWNER"
  | "OWNER"
  | "SALON_MANAGER"
  | "MANAGER"
  | "SALON_RECEPTIONIST"
  | "RECEPTIONIST"
  | "SALON_BEAUTICIAN"
  | "BEAUTICIAN"
  | "SALON_CASHIER"
  | "CASHIER"
  | "SALON_INVENTORY_MANAGER"
  | "INVENTORY_MANAGER";

export interface User {
  id: string;
  tenant_id?: string | null;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  legal_name?: string;
  gstin?: string;
  phone: string;
  email: string;
  address?: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  currency: string;
  opening_time: string;
  closing_time: string;
  default_appointment_duration: number;
  invoice_prefix: string;
  thermal_header?: string;
  thermal_footer?: string;
  tax_configuration?: {
    gst_enabled?: boolean;
    gst_rate?: number;
    cgst_rate?: number;
    sgst_rate?: number;
    composition_scheme?: boolean;
    prices_include_tax?: boolean;
    [key: string]: any;
  };
  subscription_status?: string;
  subscription_end_date?: string;
  subscription_plan_id?: string;
  is_demo: boolean;
  is_active: boolean;
}

export interface Staff {
  id: string;
  tenant_id: string;
  name: string;
  mobile: string;
  email?: string;
  designation: string;
  specialization: string;
  color_code: string;
  commission_type: "NONE" | "FIXED" | "PERCENTAGE";
  commission_rate: number;
  working_hours_start: string;
  working_hours_end: string;
  is_active: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface Service {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  sac_code: string;
  gst_rate: number;
  is_commission_eligible: boolean;
  image_url?: string;
  is_active: boolean;
  category_name?: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string;
  mobile: string;
  email?: string;
  gender?: string;
  dob?: string;
  address?: string;
  notes?: string;
  preferences?: string;
  vip_status: boolean;
  total_spend: number;
  total_visits: number;
  last_visit_date?: string;
  is_active: boolean;
}

export type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  tenant_id: string;
  appointment_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  staff_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  is_walkin: boolean;
  notes?: string;
  cancellation_reason?: string;
  invoice_id?: string;
  service_name?: string;
  staff_name?: string;
  staff_color?: string;
}

export interface InvoiceItem {
  id: string;
  item_type: "SERVICE" | "PRODUCT" | "PACKAGE";
  service_id?: string;
  product_id?: string;
  package_id?: string;
  staff_id?: string;
  item_name: string;
  hsn_sac: string;
  quantity: number;
  unit_price: number;
  discount: number;
  taxable_value: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  commission_amount: number;
  staff_name?: string;
}

export interface Payment {
  id: string;
  amount: number;
  payment_method: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
  transaction_reference?: string;
  payment_date: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  invoice_type: "B2C" | "B2B";
  appointment_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_gstin?: string;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: "PAID" | "PARTIAL" | "UNPAID" | "REFUNDED";
  notes?: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface Package {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  price: number;
  total_sessions: number;
  validity_days: number;
  applicable_service_id?: string;
  discount_percentage: number;
  is_active: boolean;
  applicable_service_name?: string;
}

export interface CustomerPackage {
  id: string;
  tenant_id: string;
  customer_id: string;
  package_id: string;
  package_name: string;
  purchase_date: string;
  expiry_date: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  status: "ACTIVE" | "EXPIRED" | "EXHAUSTED" | "CANCELLED";
  customer_name?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string;
  product_type: "RETAIL" | "CONSUMABLE" | "BOTH";
  name: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  unit: string;
  purchase_price: number;
  retail_price: number;
  hsn_code: string;
  gst_rate: number;
  current_stock: number;
  reorder_level: number;
  is_active: boolean;
  category_name?: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  description?: string;
}

export interface DashboardKPIs {
  today_revenue: number;
  today_cash_collected: number;
  today_digital_collected: number;
  today_appointments: number;
  today_completed_services: number;
  today_walkin_customers: number;
  today_returning_customers: number;
  pending_receivables: number;
  today_expenses: number;
  net_operating_profit: number;
  low_stock_count: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  cash_collected: number;
  appointments_count: number;
}

export interface ServiceBreakdown {
  service_id: string;
  service_name: string;
  category_name: string;
  service_count: number;
  revenue: number;
}

export interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  designation: string;
  color_code: string;
  services_completed: number;
  revenue_generated: number;
  commission_earned: number;
}

export interface DashboardSummary {
  kpis: DashboardKPIs;
  revenue_trends: RevenueTrendPoint[];
  service_breakdown: ServiceBreakdown[];
  staff_performance: StaffPerformance[];
}

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  Phone,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  Printer,
  FileText,
  CheckCircle,
  Scissors,
  Boxes,
  Split,
  QrCode,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Service, Product, Staff, Customer, Invoice } from "../../types";

interface CartItem {
  id: string;
  item_type: "SERVICE" | "PRODUCT";
  service_id?: string;
  product_id?: string;
  name: string;
  unit_price: number;
  quantity: number;
  discount: number;
  gst_rate: number;
  staff_id?: string;
}

export const POSPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const linkedApptId = searchParams.get("appt_id");

  // Cart & Customer states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"SERVICES" | "PRODUCTS">("SERVICES");
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Customer state (B2C walk-in is default!)
  const [customerName, setCustomerName] = useState<string>("Walk-in Client");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Payment method selection & split payments
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "CARD" | "SPLIT">("UPI");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState<string>("");

  // Completed invoice modal state
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Queries
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["posServices"],
    queryFn: async () => (await apiClient.get("/services")).data,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["posProducts"],
    queryFn: async () => (await apiClient.get("/inventory/products?product_type=RETAIL")).data,
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => (await apiClient.get("/staff")).data,
  });

  // Calculate cart finances
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
  const netTaxableGross = Math.max(0, subtotal - itemDiscounts - overallDiscount);
  // Inclusive GST back-calculation for display: 18% standard
  const calculatedTax = Math.round((netTaxableGross - netTaxableGross / 1.18) * 100) / 100;
  const taxableBase = Math.round((netTaxableGross / 1.18) * 100) / 100;
  const grandTotal = netTaxableGross;

  // Add item to cart
  const addToCart = (type: "SERVICE" | "PRODUCT", item: Service | Product) => {
    const existingIndex = cart.findIndex(
      (c) => (type === "SERVICE" ? c.service_id === item.id : c.product_id === item.id)
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const defaultStaffId = staffList[0]?.id;
      const newItem: CartItem = {
        id: `${type}-${item.id}-${Date.now()}`,
        item_type: type,
        service_id: type === "SERVICE" ? item.id : undefined,
        product_id: type === "PRODUCT" ? item.id : undefined,
        name: item.name,
        unit_price: Number(type === "SERVICE" ? (item as Service).price : (item as Product).retail_price),
        quantity: 1,
        discount: 0,
        gst_rate: Number(item.gst_rate || 18.0),
        staff_id: defaultStaffId,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const newQ = updated[index].quantity + delta;
    if (newQ <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQ;
    }
    setCart(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const updateItemStaff = (index: number, staffId: string) => {
    const updated = [...cart];
    updated[index].staff_id = staffId;
    setCart(updated);
  };

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/pos/checkout", payload)).data,
    onSuccess: (invoice: Invoice) => {
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["posProducts"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setCompletedInvoice(invoice);
      setCart([]);
      setCustomerName("Walk-in Client");
      setCustomerPhone("");
      setOverallDiscount(0);
      setCashAmount(0);
      setUpiAmount(0);
      setCardAmount(0);
      setTransactionRef("");
    },
    onError: (err: any) => alert("Checkout error: " + (err.response?.data?.detail || err.message)),
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty! Add services or products first.");
      return;
    }

    // Build payments list
    let payments: any[] = [];
    if (paymentMode === "SPLIT") {
      if (cashAmount > 0) payments.push({ amount: cashAmount, payment_method: "CASH" });
      if (upiAmount > 0) payments.push({ amount: upiAmount, payment_method: "UPI", transaction_reference: transactionRef });
      if (cardAmount > 0) payments.push({ amount: cardAmount, payment_method: "CARD", transaction_reference: transactionRef });
    } else {
      payments.push({
        amount: grandTotal,
        payment_method: paymentMode,
        transaction_reference: transactionRef || undefined,
      });
    }

    const payload = {
      invoice_type: "B2C",
      appointment_id: linkedApptId || undefined,
      customer_id: customerId || undefined,
      customer_name: customerName || "Walk-in Client",
      customer_phone: customerPhone || undefined,
      discount_amount: overallDiscount,
      items: cart.map((c) => ({
        item_type: c.item_type,
        service_id: c.service_id,
        product_id: c.product_id,
        staff_id: c.staff_id,
        item_name: c.name,
        quantity: c.quantity,
        unit_price: c.unit_price,
        discount: c.discount,
        gst_rate: c.gst_rate,
      })),
      payments,
    };

    checkoutMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Point of Sale (POS) Cash Register
          </h1>
          <p className="text-xs text-gray-500">
            High-speed walk-in billing, multi-service, retail products and split payments.
          </p>
        </div>

        {linkedApptId && (
          <div className="bg-salon-gold/20 text-salon-gold-dark px-3 py-1 rounded-xl text-xs font-semibold border border-salon-gold/30">
            Billing Linked Appointment #{linkedApptId.substring(0, 8)}
          </div>
        )}
      </div>

      {/* Main POS Split Screen: Catalog (Left 65%) vs Live Cart Summary (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Service & Product Selector Tiles (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Controls: Mode Switch & Live Filter */}
          <div className="bg-white p-3 rounded-2xl border border-salon-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-salon-ivory rounded-xl border border-salon-border w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("SERVICES")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "SERVICES"
                    ? "bg-salon-charcoal text-white shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-salon-gold" />
                Salon Treatments
              </button>
              <button
                onClick={() => setActiveTab("PRODUCTS")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "PRODUCTS"
                    ? "bg-salon-charcoal text-white shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-salon-gold" />
                Retail Cosmetics
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search items..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-salon-ivory text-xs rounded-xl border border-salon-border focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          {/* Catalog Tiles Grid (Touch-friendly for tablets) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {activeTab === "SERVICES"
              ? services
                  .filter((s) => s.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => addToCart("SERVICE", svc)}
                      className="bg-white p-3.5 rounded-2xl border border-salon-border hover:border-salon-gold shadow-sm text-left flex flex-col justify-between h-28 hover:shadow-md transition active:scale-[0.98]"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-salon-gold-dark uppercase tracking-wider block">
                          {svc.category_name || "Service"}
                        </span>
                        <h4 className="font-serif font-bold text-xs text-salon-charcoal mt-1 line-clamp-2">
                          {svc.name}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-salon-border/50">
                        <span className="text-[10px] text-gray-500">{svc.duration_minutes}m</span>
                        <span className="font-bold text-salon-charcoal font-sans">
                          ₹ {svc.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </button>
                  ))
              : products
                  .filter((p) => p.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => addToCart("PRODUCT", prod)}
                      className="bg-white p-3.5 rounded-2xl border border-salon-border hover:border-salon-gold shadow-sm text-left flex flex-col justify-between h-28 hover:shadow-md transition active:scale-[0.98]"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Stock: {prod.current_stock}
                        </span>
                        <h4 className="font-serif font-bold text-xs text-salon-charcoal mt-1 line-clamp-2">
                          {prod.name}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-salon-border/50">
                        <span className="text-[10px] text-gray-400">{prod.brand}</span>
                        <span className="font-bold text-salon-charcoal font-sans">
                          ₹ {prod.retail_price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </button>
                  ))}
          </div>
        </div>

        {/* Right Side: Active Cart & Bill Calculator (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-salon-border shadow-luxury p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-salon-border">
            <h3 className="font-serif font-bold text-base text-salon-charcoal flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-salon-gold" />
              Bill Cart ({cart.length})
            </h3>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-500 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Quick Walk-in Customer Input */}
          <div className="bg-salon-ivory p-3 rounded-xl border border-salon-border space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              B2C Client (Optional Registration)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Walk-in Client"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-2.5 py-1.5 bg-white text-xs rounded-lg border border-salon-border focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Mobile (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-2.5 py-1.5 bg-white text-xs rounded-lg border border-salon-border focus:outline-none"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No items added yet. Tap treatments or products on the left to start billing.
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-salon-border bg-salon-ivory/30 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-salon-charcoal">{item.name}</p>
                      <p className="text-[10px] text-gray-500">₹{item.unit_price} each</p>
                    </div>
                    <span className="font-bold text-xs text-salon-charcoal font-sans">
                      ₹ {(item.unit_price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-black/5 text-xs">
                    {/* Staff Tag */}
                    <div className="flex items-center gap-1">
                      <select
                        value={item.staff_id || ""}
                        onChange={(e) => updateItemStaff(idx, e.target.value)}
                        className="text-[10px] bg-white border border-salon-border rounded-md px-1.5 py-0.5 focus:outline-none"
                      >
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-rose-500 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount & Totals Section (Simple Non-GST Launch Mode) */}
          <div className="pt-3 border-t border-salon-border space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={overallDiscount}
                onChange={(e) => setOverallDiscount(Number(e.target.value))}
                className="w-20 px-2 py-0.5 text-right bg-salon-ivory border border-salon-border rounded-md text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-base font-bold text-salon-charcoal pt-2 border-t border-salon-border">
              <span>Final Amount Payable:</span>
              <span className="text-salon-gold-dark font-sans text-xl">
                ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-gray-700 block">Payment Tender</label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {(["UPI", "CASH", "CARD", "SPLIT"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 rounded-lg font-bold transition text-center ${
                    paymentMode === mode
                      ? "bg-salon-gold text-salon-charcoal shadow-sm"
                      : "bg-salon-ivory text-gray-600 hover:bg-salon-ivory-warm"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Split Tender Inputs */}
            {paymentMode === "SPLIT" && (
              <div className="p-2.5 bg-salon-ivory rounded-xl border border-salon-border space-y-2 mt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Cash:</span>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-white border border-salon-border rounded text-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>UPI:</span>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-white border border-salon-border rounded text-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Card:</span>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-white border border-salon-border rounded text-right"
                  />
                </div>
                <p className="text-[10px] text-gray-500 text-right">
                  Total Allocated: ₹{cashAmount + upiAmount + cardAmount} / ₹{grandTotal}
                </p>
              </div>
            )}

            {paymentMode !== "CASH" && (
              <input
                type="text"
                placeholder="UPI ref or Card last 4 digits (Optional)"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-1.5 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
              />
            )}
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutMutation.isPending}
            className="w-full py-3 bg-gradient-to-r from-salon-charcoal to-salon-charcoal-card text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4 text-salon-gold" />
            {checkoutMutation.isPending ? "Generating Invoice..." : `Collect & Settle Bill (₹${grandTotal})`}
          </button>
        </div>
      </div>

      {/* Invoice Generated Success Modal with A4 & Thermal Print Buttons */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-salon-charcoal">
                Invoice Generated Successfully!
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Bill <span className="font-bold text-salon-charcoal">{completedInvoice.invoice_number}</span> has been paid and logged to PostgreSQL.
              </p>
            </div>

            <div className="bg-salon-ivory p-4 rounded-xl border border-salon-border text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Client:</span>
                <span className="font-semibold text-salon-charcoal">{completedInvoice.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Settled:</span>
                <span className="font-bold text-salon-charcoal">₹ {completedInvoice.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items Billed:</span>
                <span>{completedInvoice.items.length} items</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`/api/v1/pos/invoices/${completedInvoice.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 bg-salon-charcoal text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black transition shadow-sm"
              >
                <FileText className="w-4 h-4 text-salon-gold" />
                Print A4 Invoice
              </a>
              <a
                href={`/api/v1/pos/invoices/${completedInvoice.id}/thermal`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 bg-salon-gold text-salon-charcoal rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-salon-gold-light transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print 80mm Receipt
              </a>
            </div>

            <button
              onClick={() => setCompletedInvoice(null)}
              className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-black mt-2"
            >
              Close & Ready for Next Client
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

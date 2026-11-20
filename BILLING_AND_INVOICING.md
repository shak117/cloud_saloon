# CLOUD SALON – Billing & Invoicing Engine Specification
## Cloud Technologies | Simple Non-GST Launch Mode & Modular Tax Architecture

### 1. Business Billing Strategy
A substantial segment of independent salons, barber shops, and beauty parlours in India operate beneath the statutory GST turnover threshold (₹20 Lakhs / ₹40 Lakhs) and are legally eligible to trade without GST registration.

**Decision for Cloud Salon Initial Launch:**
* **Simple Non-GST Billing is the Default Launch Mode**.
* Ordinary customer invoices and thermal receipts are generated without mandatory tax numbers or tax breakups.
* Unregistered salons are never mislabeled as generating "GST Tax Invoices".
* Modular tax architecture is preserved in backend services (`GSTEngine`) and will be enabled on-demand for registered salons.

---

### 2. Standard Simple Billing Fields

Every customer bill supports:
* **Salon Identity**: Salon Name, Logo, Address, City, State, Contact Phone, and Email.
* **Invoice Metadata**: Document title (`RETAIL BILL / RECEIPT`), Unique Sequential Invoice Number (e.g. `CS-202611-1043`), and Date/Time.
* **Customer Information**: Optional Walk-in client name, Optional phone number (No forced customer registration before service purchase!).
* **Line Items**: Service / Product Name, Stylist Attribution, Quantity, Unit Rate, Line Discount, Total Line Amount.
* **Financial Summary**: Gross Subtotal, Total Discounts, Final Payable Amount, Amount Paid, Outstanding Balance, Payment Status (`PAID`, `PARTIAL`, `UNPAID`).
* **Payment Tenders**: Cash, UPI, Card, Net Banking, or Split Tenders (e.g. ₹500 UPI + ₹300 Cash).

---

### 3. Numerical Billing Example

```
Haircut & Styling:   ₹ 300.00
Hydra Facial Glow:   ₹ 800.00
Keratin Shampoo:     ₹ 400.00
-----------------------------
Gross Subtotal:      ₹ 1,500.00
Promotional Discount:-₹   100.00
=============================
FINAL NET AMOUNT:    ₹ 1,400.00

Payment Recorded:
- UPI (Ref: UPI-778822): ₹ 1,000.00
- Cash Received:         ₹   400.00
-----------------------------
Outstanding Balance:     ₹     0.00
Payment Status:          PAID
```
* **Statutory Taxes in Launch Mode**: CGST = ₹0.00, SGST = ₹0.00, IGST = ₹0.00.
* No GST calculation is added to the customer bill.

---

### 4. Modular Future GST Compatibility Architecture

The codebase retains a dedicated statutory tax calculation engine (`backend/app/services/gst_engine.py`):
```python
class GSTEngine:
    @staticmethod
    def calculate_inclusive_line(inclusive_amount: Decimal, gst_rate: Decimal, discount: Decimal, is_interstate: bool):
        # Forward/Backward GST back-calculation formula
        # Enabled dynamically when tenant.tax_configuration["gst_enabled"] == True
        ...
```

When a salon registers for GST and enables the toggle in **Settings → Tax Configuration**:
1. Document header shifts from `RETAIL BILL / RECEIPT` to `TAX INVOICE`.
2. Salon GSTIN and State Code (e.g. `27` for Maharashtra) render on invoice headers.
3. Service SAC (`999721`) and Product HSN (`330510`) codes appear on line items.
4. Intra-State (CGST 9% + SGST 9%) or Inter-State (IGST 18%) taxes calculate automatically from inclusive MRP rates.
5. Historical non-GST invoices are **never retroactively recalculated**.

---

### 5. Document Printing Outputs

1. **A4 Retail Bill / Invoice (PDF)**:
   - Generated via ReportLab (`/api/v1/pos/invoices/{id}/pdf`).
   - Clean, professional typography with salon logo, customer block, line items table, payment tender details, and terms.
2. **80mm POS Thermal Receipt (ESC/POS & PDF)**:
   - Generated via ReportLab (`/api/v1/pos/invoices/{id}/thermal`).
   - Compact 226-point width formatted for standard thermal receipt printers (Epson, TVS, NGX, Bluetooth ESC/POS).
   - Fast 1-click printing directly from the cashier checkout modal.

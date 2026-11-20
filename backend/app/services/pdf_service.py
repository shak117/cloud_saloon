import io
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from app.models.invoice import Invoice
from app.models.tenant import Tenant

def generate_a4_tax_invoice(invoice: Invoice, tenant: Tenant) -> bytes:
    """
    Generates an A4 Retail Bill or Tax Invoice PDF.
    By default in Cloud Salon Launch Mode, generates an ordinary customer bill/receipt with NO GST.
    If GST is explicitly configured and enabled for a registered salon, includes statutory tax details.
    """
    is_gst_enabled = bool(
        tenant.tax_configuration and tenant.tax_configuration.get("gst_enabled", False)
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#12141A"),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "SubStyle",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        spaceAfter=2
    )
    heading_style = ParagraphStyle(
        "Heading",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#C5A059")
    )
    normal_style = ParagraphStyle(
        "NormalText",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#222222")
    )
    
    elements = []
    
    # 1. Header with Salon branding
    doc_title = "TAX INVOICE" if is_gst_enabled else "RETAIL BILL / RECEIPT"
    gstin_line = f"<br/><b>GSTIN: {tenant.gstin}</b>" if (is_gst_enabled and tenant.gstin) else ""

    header_data = [
        [
            Paragraph(f"<b>{tenant.legal_name or tenant.name}</b>", title_style),
            Paragraph(f"<b>{doc_title}</b>", ParagraphStyle("InvHead", parent=title_style, alignment=2, textColor=colors.HexColor("#C5A059")))
        ],
        [
            Paragraph(f"{tenant.address or ''}<br/>{tenant.city}, {tenant.state} - {tenant.pincode}<br/>Phone: {tenant.phone} | Email: {tenant.email}{gstin_line}", subtitle_style),
            Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}<br/><b>Date:</b> {invoice.invoice_date.strftime('%d-%b-%Y %I:%M %p')}<br/><b>Status:</b> {invoice.payment_status}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[320, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15))
    
    # 2. Customer Information (B2C Default)
    cust_phone_line = f" | Phone: {invoice.customer_phone}" if invoice.customer_phone else ""
    client_data = [
        [
            Paragraph("<b>BILLED TO (CLIENT):</b>", heading_style),
            Paragraph("<b>SALON DETAILS:</b>", heading_style)
        ],
        [
            Paragraph(f"<b>{invoice.customer_name or 'Walk-in Client'}</b>{cust_phone_line}", normal_style),
            Paragraph(f"{tenant.name}<br/>{tenant.city}, {tenant.state}", normal_style)
        ]
    ]
    client_table = Table(client_data, colWidths=[320, 200])
    client_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8F9FA")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 15))
    
    # 3. Itemized Services & Products Table
    if is_gst_enabled:
        items_data = [
            ["#", "Item Description", "SAC/HSN", "Qty", "Rate (₹)", "Disc (₹)", "Taxable (₹)", "GST", "Total (₹)"]
        ]
        col_widths = [20, 160, 50, 30, 50, 45, 55, 45, 65]
        for idx, item in enumerate(invoice.items, start=1):
            items_data.append([
                str(idx),
                item.item_name,
                item.hsn_sac or "-",
                f"{item.quantity:.0f}",
                f"{item.unit_price:.2f}",
                f"{item.discount:.2f}",
                f"{item.taxable_value:.2f}",
                f"{item.gst_rate:.0f}%",
                f"{item.total_amount:.2f}"
            ])
    else:
        # Simple non-GST layout: Clean, uncluttered, no tax columns
        items_data = [
            ["#", "Item Description", "Qty", "Rate (₹)", "Discount (₹)", "Amount (₹)"]
        ]
        col_widths = [25, 255, 45, 65, 60, 70]
        for idx, item in enumerate(invoice.items, start=1):
            items_data.append([
                str(idx),
                item.item_name,
                f"{item.quantity:.0f}",
                f"{item.unit_price:.2f}",
                f"{item.discount:.2f}",
                f"{item.total_amount:.2f}"
            ])

    items_table = Table(items_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1A1D24")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F9FAFB")]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))
    
    # 4. Summary & Totals
    if is_gst_enabled:
        summary_data = [
            ["Subtotal (Gross):", f"₹ {invoice.subtotal:.2f}"],
            ["Discount:", f"-₹ {invoice.discount_amount:.2f}"],
            ["Taxable Amount:", f"₹ {invoice.taxable_amount:.2f}"],
            ["CGST:", f"₹ {invoice.cgst_amount:.2f}"],
            ["SGST:", f"₹ {invoice.sgst_amount:.2f}"],
            ["Grand Total:", f"₹ {invoice.total_amount:.2f}"],
            ["Amount Paid:", f"₹ {invoice.paid_amount:.2f}"],
            ["Balance Due:", f"₹ {invoice.balance_amount:.2f}"]
        ]
    else:
        # Simple non-GST totals
        summary_data = [
            ["Subtotal:", f"₹ {invoice.subtotal:.2f}"],
            ["Discount:", f"-₹ {invoice.discount_amount:.2f}"],
            ["Final Amount Payable:", f"₹ {invoice.total_amount:.2f}"],
            ["Amount Paid:", f"₹ {invoice.paid_amount:.2f}"],
            ["Outstanding Balance:", f"₹ {invoice.balance_amount:.2f}"]
        ]

    summary_table = Table(summary_data, colWidths=[130, 80])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,-3), (-1,-3), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TEXTCOLOR', (0,-3), (-1,-3), colors.HexColor("#C5A059")),
    ]))
    
    payments_info = "<b>Payment Details:</b><br/>"
    if invoice.payments:
        for p in invoice.payments:
            ref = f" (Ref: {p.transaction_reference})" if p.transaction_reference else ""
            payments_info += f"• {p.payment_method}: ₹{p.amount:.2f}{ref}<br/>"
    else:
        payments_info += "No payments recorded yet."
        
    bottom_table = Table([
        [Paragraph(payments_info, normal_style), summary_table]
    ], colWidths=[310, 210])
    elements.append(bottom_table)
    elements.append(Spacer(1, 20))
    
    # 5. Terms & Signature
    footer_text = f"<font size=8 color='#666'>{tenant.thermal_footer or 'Thank you for your visit!'}<br/>Computer generated bill/receipt.</font>"
    elements.append(Paragraph(footer_text, normal_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_thermal_receipt(invoice: Invoice, tenant: Tenant) -> bytes:
    """Generates an 80mm POS Thermal Receipt PDF in simple non-GST mode."""
    is_gst_enabled = bool(
        tenant.tax_configuration and tenant.tax_configuration.get("gst_enabled", False)
    )

    buffer = io.BytesIO()
    # 80mm width = 226 points
    thermal_page = (226, 600)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=thermal_page,
        rightMargin=10,
        leftMargin=10,
        topMargin=15,
        bottomMargin=15
    )
    
    styles = getSampleStyleSheet()
    center_bold = ParagraphStyle("C_Bold", alignment=1, fontSize=10, fontName="Helvetica-Bold")
    center_text = ParagraphStyle("C_Text", alignment=1, fontSize=7, leading=9)
    left_text = ParagraphStyle("L_Text", alignment=0, fontSize=7, leading=9)
    right_text = ParagraphStyle("R_Text", alignment=2, fontSize=7, leading=9)
    
    elements = []
    
    # Header
    elements.append(Paragraph(f"<b>{tenant.name}</b>", center_bold))
    addr_line = f"{tenant.address or ''}<br/>Tel: {tenant.phone}"
    if is_gst_enabled and tenant.gstin:
        addr_line += f"<br/>GSTIN: {tenant.gstin}"
    elements.append(Paragraph(addr_line, center_text))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("--------------------------------------------------", center_text))
    bill_label = "Bill" if not is_gst_enabled else "Tax Inv"
    elements.append(Paragraph(f"{bill_label}: {invoice.invoice_number} | {invoice.invoice_date.strftime('%d/%m/%y %H:%M')}<br/>Client: {invoice.customer_name or 'Walk-in Client'}", left_text))
    elements.append(Paragraph("--------------------------------------------------", center_text))
    
    # Items
    item_rows = [
        [Paragraph("<b>Item</b>", left_text), Paragraph("<b>Qty</b>", center_text), Paragraph("<b>Total</b>", right_text)]
    ]
    for it in invoice.items:
        item_rows.append([
            Paragraph(it.item_name[:20], left_text),
            Paragraph(f"{it.quantity:.0f}", center_text),
            Paragraph(f"₹{it.total_amount:.2f}", right_text)
        ])
    
    i_table = Table(item_rows, colWidths=[120, 30, 56])
    i_table.setStyle(TableStyle([
        ('PADDING', (0,0), (-1,-1), 1),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(i_table)
    elements.append(Paragraph("--------------------------------------------------", center_text))
    
    # Totals (Simple Non-GST by default)
    totals_data = [
        [Paragraph("Subtotal:", left_text), Paragraph(f"₹{invoice.subtotal:.2f}", right_text)],
        [Paragraph("Discount:", left_text), Paragraph(f"-₹{invoice.discount_amount:.2f}", right_text)],
    ]
    if is_gst_enabled:
        totals_data.append([
            Paragraph("GST (Included):", left_text),
            Paragraph(f"₹{(invoice.cgst_amount + invoice.sgst_amount):.2f}", right_text)
        ])
    totals_data.extend([
        [Paragraph("<b>Final Amount:</b>", left_text), Paragraph(f"<b>₹{invoice.total_amount:.2f}</b>", right_text)],
        [Paragraph("Paid Amount:", left_text), Paragraph(f"₹{invoice.paid_amount:.2f}", right_text)],
        [Paragraph("Balance Due:", left_text), Paragraph(f"₹{invoice.balance_amount:.2f}", right_text)],
    ])

    t_table = Table(totals_data, colWidths=[110, 96])
    t_table.setStyle(TableStyle([
        ('PADDING', (0,0), (-1,-1), 1),
    ]))
    elements.append(t_table)
    elements.append(Spacer(1, 6))
    
    # Footer
    elements.append(Paragraph(f"{tenant.thermal_footer or 'Thank you, please visit again!'}", center_text))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

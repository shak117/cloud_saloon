from decimal import Decimal, ROUND_HALF_UP
from typing import Dict

def round_curr(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class GSTEngine:
    """
    Statutory GST calculation engine for salon services and retail cosmetics in India.
    Supports Intra-State (CGST + SGST) and Inter-State (IGST).
    """

    @staticmethod
    def calculate_inclusive_line(
        inclusive_amount: Decimal,
        gst_rate: Decimal,
        discount: Decimal = Decimal("0.0"),
        is_interstate: bool = False
    ) -> Dict[str, Decimal]:
        """
        Back-calculates taxable value and tax amounts from MRP/inclusive price after discount.
        Example: ₹1180 with 18% GST -> Taxable: ₹1000, CGST: ₹90, SGST: ₹90.
        """
        net_inclusive = max(Decimal("0.0"), inclusive_amount - discount)
        if gst_rate == Decimal("0.0"):
            return {
                "taxable_value": round_curr(net_inclusive),
                "cgst_amount": Decimal("0.00"),
                "sgst_amount": Decimal("0.00"),
                "igst_amount": Decimal("0.00"),
                "total_amount": round_curr(net_inclusive)
            }
        
        factor = Decimal("1.0") + (gst_rate / Decimal("100.0"))
        taxable_val = round_curr(net_inclusive / factor)
        total_tax = net_inclusive - taxable_val
        
        if is_interstate:
            return {
                "taxable_value": taxable_val,
                "cgst_amount": Decimal("0.00"),
                "sgst_amount": Decimal("0.00"),
                "igst_amount": round_curr(total_tax),
                "total_amount": round_curr(net_inclusive)
            }
        else:
            half_tax = round_curr(total_tax / Decimal("2.0"))
            return {
                "taxable_value": taxable_val,
                "cgst_amount": half_tax,
                "sgst_amount": half_tax,
                "igst_amount": Decimal("0.00"),
                "total_amount": round_curr(net_inclusive)
            }

    @staticmethod
    def calculate_exclusive_line(
        taxable_value: Decimal,
        gst_rate: Decimal,
        discount: Decimal = Decimal("0.0"),
        is_interstate: bool = False
    ) -> Dict[str, Decimal]:
        """
        Forward-calculates tax amounts from exclusive taxable base.
        """
        net_taxable = max(Decimal("0.0"), taxable_value - discount)
        if is_interstate:
            igst = round_curr(net_taxable * (gst_rate / Decimal("100.0")))
            total = net_taxable + igst
            return {
                "taxable_value": round_curr(net_taxable),
                "cgst_amount": Decimal("0.00"),
                "sgst_amount": Decimal("0.00"),
                "igst_amount": igst,
                "total_amount": round_curr(total)
            }
        else:
            half_rate = gst_rate / Decimal("2.0")
            cgst = round_curr(net_taxable * (half_rate / Decimal("100.0")))
            sgst = round_curr(net_taxable * (half_rate / Decimal("100.0")))
            total = net_taxable + cgst + sgst
            return {
                "taxable_value": round_curr(net_taxable),
                "cgst_amount": cgst,
                "sgst_amount": sgst,
                "igst_amount": Decimal("0.00"),
                "total_amount": round_curr(total)
            }

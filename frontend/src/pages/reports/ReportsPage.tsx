import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient } from "../../api/client";

export const ReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: report, isLoading } = useQuery({
    queryKey: ["financialReport", startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get(
        `/reports/financial-overview?start_date=${startDate}&end_date=${endDate}`
      );
      return res.data;
    },
  });

  const handleExportCSV = () => {
    window.open(`/api/v1/reports/export/sales-csv?start_date=${startDate}&end_date=${endDate}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Reports & Financial Statements
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Daily and monthly sales reports, payment collections, operating profit statement and CSV exports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-salon-border shadow-sm text-xs">
        <span className="font-semibold text-gray-600 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-salon-gold" /> Filter Date Period:
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-2.5 py-1.5 bg-salon-ivory rounded-lg border border-salon-border"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-2.5 py-1.5 bg-salon-ivory rounded-lg border border-salon-border"
        />
      </div>

      {/* Financial Statement Overview */}
      {report && (
        <div className="space-y-6">
          {/* Main Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Billed Sales
              </span>
              <span className="text-2xl font-bold text-salon-charcoal font-sans block mt-1">
                ₹ {report.total_sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                Discounts given: ₹{report.total_discount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Collections
              </span>
              <span className="text-2xl font-bold text-emerald-800 font-sans block mt-1">
                ₹ {report.total_paid_collections.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-amber-700 mt-1 block font-medium">
                Pending: ₹{report.total_outstanding_receivables.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Operating Costs
              </span>
              <span className="text-2xl font-bold text-rose-700 font-sans block mt-1">
                ₹ {(report.total_operating_expenses + report.total_staff_commissions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                Expenses & Commissions
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Estimated Net Profit
              </span>
              <span className="text-2xl font-bold text-emerald-700 font-sans block mt-1">
                ₹ {report.estimated_net_profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                Sales - Expenses - Commissions
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown & Outflow Reconciliation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
              <h3 className="font-serif font-bold text-base text-salon-charcoal mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-salon-gold" />
                Payment Tender Breakdown
              </h3>
              <div className="space-y-3">
                {report.payment_modes_breakdown.map((pm: any) => (
                  <div key={pm.method} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-salon-ivory">
                    <span className="font-semibold text-salon-charcoal">{pm.method}</span>
                    <span className="font-bold text-salon-charcoal font-sans text-sm">
                      ₹ {pm.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-salon-border shadow-luxury">
              <h3 className="font-serif font-bold text-base text-salon-charcoal mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                Cost & Commission Summary
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-salon-ivory">
                  <span className="font-semibold text-gray-700">Operating Expenses (Rent, Bills):</span>
                  <span className="font-bold text-rose-700 text-sm">
                    ₹ {report.total_operating_expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-salon-ivory">
                  <span className="font-semibold text-gray-700">Staff Service Commissions:</span>
                  <span className="font-bold text-rose-700 text-sm">
                    ₹ {report.total_staff_commissions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900">Net Estimated Operating Margin:</span>
                  <span className="font-bold text-emerald-800 text-base">
                    ₹ {report.estimated_net_profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

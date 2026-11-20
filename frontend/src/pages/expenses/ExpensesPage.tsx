import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingDown,
  Plus,
  Calendar,
  IndianRupee,
  FileText,
  Filter,
  DollarSign,
  PieChart,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Expense } from "../../types";

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "SUPPLIES",
    amount: 1500,
    expense_date: new Date().toISOString().split("T")[0],
    payment_method: "UPI",
    description: "",
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", selectedCategory],
    queryFn: async () => {
      let url = "/expenses?";
      if (selectedCategory !== "ALL") url += `category=${selectedCategory}&`;
      return (await apiClient.get(url)).data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ["expensesSummary"],
    queryFn: async () => (await apiClient.get("/expenses/summary")).data,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/expenses", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expensesSummary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      setShowAddModal(false);
      setFormData({
        title: "",
        category: "SUPPLIES",
        amount: 1500,
        expense_date: new Date().toISOString().split("T")[0],
        payment_method: "UPI",
        description: "",
      });
    },
    onError: (err: any) => alert("Failed to log expense: " + (err.response?.data?.detail || err.message)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amount <= 0) {
      alert("Please enter title and positive amount.");
      return;
    }
    addExpenseMutation.mutate(formData);
  };

  const categoriesList = [
    "RENT", "ELECTRICITY", "SALARY", "SUPPLIES", "MARKETING", "MAINTENANCE", "OTHER"
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Operating Expense Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Log shop lease, electricity, treatment supplies and staff payroll for accurate profit calculations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-salon-gold" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Expense Category Breakdown Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-salon-border shadow-sm col-span-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              Total Expenses
            </span>
            <span className="text-2xl font-bold text-rose-700 font-sans block mt-1">
              ₹ {summary.total_expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">Operating outflow</span>
          </div>

          {summary.breakdown.slice(0, 4).map((b: any) => (
            <div key={b.category} className="p-3.5 bg-white rounded-2xl border border-salon-border shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 block uppercase truncate">
                {b.category}
              </span>
              <span className="text-sm font-bold text-salon-charcoal font-sans block mt-1">
                ₹ {b.total_amount.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-gray-400">{b.count} records</span>
            </div>
          ))}
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-2xl border border-salon-border shadow-sm">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedCategory === "ALL"
              ? "bg-salon-charcoal text-white shadow-sm"
              : "bg-salon-ivory text-gray-600 hover:text-black"
          }`}
        >
          All Expenses
        </button>
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? "bg-salon-gold text-salon-charcoal shadow-sm"
                : "bg-salon-ivory text-gray-600 hover:text-black"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-salon-border shadow-luxury overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-salon-ivory/60 border-b border-salon-border text-gray-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5">Expense Title</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Mode</th>
              <th className="p-3.5 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-salon-border">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-salon-ivory/30 transition">
                <td className="p-3.5 font-semibold text-salon-charcoal">
                  {exp.title}
                  {exp.description && (
                    <span className="block text-[10px] text-gray-400 font-normal">{exp.description}</span>
                  )}
                </td>
                <td className="p-3.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-salon-ivory border border-salon-border text-gray-700">
                    {exp.category}
                  </span>
                </td>
                <td className="p-3.5 text-gray-500">{exp.expense_date}</td>
                <td className="p-3.5 font-medium text-gray-700">{exp.payment_method}</td>
                <td className="p-3.5 text-right font-bold text-rose-700 text-sm font-sans">
                  ₹ {exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Record Salon Expense
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Studio Monthly Lease Payment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  >
                    <option value="UPI">UPI / Net Banking</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Receipt Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid to shop owner via RTGS reference..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-salon-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addExpenseMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {addExpenseMutation.isPending ? "Recording..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

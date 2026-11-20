import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  IndianRupee,
  Calendar,
  Gift,
  Check,
  AlertCircle,
  Scissors,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Package, Customer, Service } from "../../types";

export const PackagesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState<boolean>(false);

  // Forms
  const [selectedPlan, setSelectedPlan] = useState<Package | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    customer_id: "",
    payment_method: "UPI",
    transaction_reference: "",
  });

  const [redeemForm, setRedeemForm] = useState({
    customer_package_id: "",
    service_id: "",
    notes: "",
  });

  const [newPlanForm, setNewPlanForm] = useState({
    name: "",
    description: "",
    price: 4999,
    total_sessions: 5,
    validity_days: 90,
  });

  // Queries
  const { data: packagePlans = [] } = useQuery<Package[]>({
    queryKey: ["packagePlans"],
    queryFn: async () => (await apiClient.get("/packages")).data,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => (await apiClient.get("/customers")).data,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => (await apiClient.get("/services")).data,
  });

  // Purchase Package Mutation
  const purchaseMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/packages/purchase", payload)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      alert(`Success! ${data.message} (${data.remaining_sessions} sessions active).`);
      setShowPurchaseModal(false);
    },
    onError: (err: any) => alert("Purchase failed: " + (err.response?.data?.detail || err.message)),
  });

  // Redeem Session Mutation
  const redeemMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/packages/redeem", payload)).data,
    onSuccess: (data) => {
      alert(`Session redeemed! ${data.remaining_sessions} sessions remaining.`);
      setShowRedeemModal(false);
    },
    onError: (err: any) => alert("Redemption failed: " + (err.response?.data?.detail || err.message)),
  });

  // Create Plan Mutation
  const createPlanMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/packages", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packagePlans"] });
      setShowCreatePlanModal(false);
    },
    onError: (err: any) => alert("Failed to create package plan: " + (err.response?.data?.detail || err.message)),
  });

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !purchaseForm.customer_id) {
      alert("Please choose a customer.");
      return;
    }
    purchaseMutation.mutate({
      customer_id: purchaseForm.customer_id,
      package_id: selectedPlan.id,
      payment_method: purchaseForm.payment_method,
      transaction_reference: purchaseForm.transaction_reference,
    });
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemForm.customer_package_id || !redeemForm.service_id) {
      alert("Please select package ID and service.");
      return;
    }
    redeemMutation.mutate(redeemForm);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Memberships & Prepaid Service Packages
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Prepaid multi-session packages, customer pass tracking and tamper-proof session redemption.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRedeemModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Redeem Session</span>
          </button>
          <button
            onClick={() => setShowCreatePlanModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-salon-gold" />
            <span>New Package Plan</span>
          </button>
        </div>
      </div>

      {/* Package Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packagePlans.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white p-6 rounded-2xl border border-salon-border shadow-luxury flex flex-col justify-between hover:border-salon-gold transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                  {pkg.total_sessions} Sessions Pass
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-salon-gold" /> {pkg.validity_days} Days Validity
                </span>
              </div>

              <h3 className="font-serif font-bold text-lg text-salon-charcoal mt-3">
                {pkg.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pkg.description}</p>

              <div className="mt-4 p-3 rounded-xl bg-salon-ivory border border-salon-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Applicable Treatment:</span>
                  <span className="font-semibold text-salon-charcoal">{pkg.applicable_service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Effective per session:</span>
                  <span className="font-semibold text-emerald-800">
                    ₹ {Math.round(pkg.price / pkg.total_sessions).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-salon-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block">Package Price:</span>
                <span className="text-xl font-bold text-salon-charcoal font-sans">
                  ₹ {pkg.price.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPlan(pkg);
                  setShowPurchaseModal(true);
                }}
                className="px-4 py-2 bg-salon-gold text-salon-charcoal rounded-xl text-xs font-bold hover:bg-salon-gold-light transition shadow-sm"
              >
                Enroll Client
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Purchase {selectedPlan.name}
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handlePurchase} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Customer *
                </label>
                <select
                  required
                  value={purchaseForm.customer_id}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                >
                  <option value="">-- Choose Enrolling Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-salon-ivory rounded-xl border border-salon-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Sessions Allotted:</span>
                  <span className="font-bold">{selectedPlan.total_sessions} Sessions</span>
                </div>
                <div className="flex justify-between">
                  <span>Validity Period:</span>
                  <span className="font-bold">{selectedPlan.validity_days} Days</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-salon-charcoal pt-1 border-t border-salon-border">
                  <span>Package Fee:</span>
                  <span className="text-salon-gold-dark">₹ {selectedPlan.price}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={purchaseForm.payment_method}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="UPI Txn or Card ref"
                    value={purchaseForm.transaction_reference}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, transaction_reference: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-salon-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {purchaseMutation.isPending ? "Activating..." : "Confirm & Collect ₹" + selectedPlan.price}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Session Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Redeem Package Session
              </h3>
              <button onClick={() => setShowRedeemModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              <span className="font-bold">Accounting Notice:</span>
              <p className="mt-0.5">Package session redemption decrements prepaid sessions and does NOT count as fresh cash collections.</p>
            </div>

            <form onSubmit={handleRedeem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer Package Pass ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Customer Package ID (from Client Profile)"
                  value={redeemForm.customer_package_id}
                  onChange={(e) => setRedeemForm({ ...redeemForm, customer_package_id: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Service Rendered *
                </label>
                <select
                  required
                  value={redeemForm.service_id}
                  onChange={(e) => setRedeemForm({ ...redeemForm, service_id: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                >
                  <option value="">-- Choose Redeemed Treatment --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Redemption Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Session 2 of 5 completed at Studio"
                  value={redeemForm.notes}
                  onChange={(e) => setRedeemForm({ ...redeemForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-salon-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeemMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm"
                >
                  {redeemMutation.isPending ? "Redeeming..." : "Verify & Deduct Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Package Plan Modal */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Create Package Plan
              </h3>
              <button onClick={() => setShowCreatePlanModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPlanMutation.mutate(newPlanForm);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Package Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Facial & Spa Series (5 Sessions)"
                  value={newPlanForm.name}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlanForm.price}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sessions *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlanForm.total_sessions}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, total_sessions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Days Valid *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlanForm.validity_days}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, validity_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Includes 5 sessions of facials, skin polishing and cleanup."
                  value={newPlanForm.description}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-salon-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {createPlanMutation.isPending ? "Creating..." : "Save Package Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

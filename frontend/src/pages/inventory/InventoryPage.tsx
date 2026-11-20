import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Plus,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Search,
  History,
  TrendingUp,
  PackagePlus,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { Product, ProductCategory } from "../../types";

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | "RETAIL" | "CONSUMABLE">("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const [adjustForm, setAdjustForm] = useState({
    adjustment_type: "PURCHASE",
    quantity: 10,
    notes: "",
  });

  const [newProdForm, setNewProdForm] = useState({
    category_id: "",
    product_type: "RETAIL",
    name: "",
    brand: "",
    unit: "PIECE",
    purchase_price: 500,
    retail_price: 750,
    hsn_code: "330510",
    current_stock: 10,
    reorder_level: 5,
  });

  // Queries
  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["productCategories"],
    queryFn: async () => (await apiClient.get("/inventory/categories")).data,
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", activeTab, search],
    queryFn: async () => {
      let url = "/inventory/products?";
      if (activeTab !== "ALL") url += `product_type=${activeTab}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      return (await apiClient.get(url)).data;
    },
  });

  const { data: stockLedger = [] } = useQuery({
    queryKey: ["stockLedger", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      return (await apiClient.get(`/inventory/ledger/${selectedProductId}`)).data;
    },
    enabled: !!selectedProductId,
  });

  // Stock Adjustment Mutation
  const adjustMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/inventory/adjust-stock", payload)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["stockLedger"] });
      alert(`Stock adjusted for ${data.product_name}! New Balance: ${data.new_stock}`);
      setShowAdjustModal(false);
    },
    onError: (err: any) => alert("Adjustment failed: " + (err.response?.data?.detail || err.message)),
  });

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/inventory/products", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAddModal(false);
      setNewProdForm({
        category_id: "",
        product_type: "RETAIL",
        name: "",
        brand: "",
        unit: "PIECE",
        purchase_price: 500,
        retail_price: 750,
        hsn_code: "330510",
        current_stock: 10,
        reorder_level: 5,
      });
    },
    onError: (err: any) => alert("Failed to add product: " + (err.response?.data?.detail || err.message)),
  });

  const lowStockCount = products.filter((p) => p.current_stock <= p.reorder_level).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            Products & Inventory Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Distinct tracking of customer retail cosmetics vs service treatment consumables.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-salon-gold" />
          <span>Add Product / Consumable</span>
        </button>
      </div>

      {/* Low-stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">
              {lowStockCount} items have reached or dropped below their reorder threshold!
            </span>
          </div>
          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
            Needs Reordering
          </span>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-salon-border shadow-sm">
        <div className="flex items-center gap-2 p-1 bg-salon-ivory rounded-xl border border-salon-border w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Items" },
            { id: "RETAIL", label: "Retail Products (Client Sales)" },
            { id: "CONSUMABLE", label: "Consumables (In-Salon Use)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-salon-charcoal text-white shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stock..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-salon-ivory text-xs rounded-xl border border-salon-border focus:outline-none focus:border-salon-gold"
          />
        </div>
      </div>

      {/* Stock Cards Grid & Ledger Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid (2 Cols on lg) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => {
            const isLow = p.current_stock <= p.reorder_level;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`bg-white p-5 rounded-2xl border transition shadow-luxury flex flex-col justify-between cursor-pointer ${
                  selectedProductId === p.id
                    ? "border-salon-gold ring-2 ring-salon-gold/20"
                    : isLow
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-salon-border hover:border-salon-gold/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        p.product_type === "CONSUMABLE"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {p.product_type === "CONSUMABLE" ? "Treatment Consumable" : "Retail Product"}
                    </span>
                    <span className="text-[10px] text-gray-400">{p.brand}</span>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-salon-charcoal mt-2">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Unit: {p.unit} | HSN: {p.hsn_code}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-salon-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Available Balance:</span>
                    <span
                      className={`text-base font-bold font-sans ${
                        isLow ? "text-rose-600 font-extrabold" : "text-salon-charcoal"
                      }`}
                    >
                      {p.current_stock} {p.unit}
                    </span>
                    {isLow && (
                      <span className="block text-[9px] text-rose-600 font-semibold">Low Stock! (Min {p.reorder_level})</span>
                    )}
                  </div>

                  <div className="text-right">
                    {p.product_type !== "CONSUMABLE" ? (
                      <>
                        <span className="text-[10px] text-gray-400 block">Retail Price:</span>
                        <span className="font-bold text-salon-charcoal">₹ {p.retail_price}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-gray-400 block">Cost Price:</span>
                        <span className="font-bold text-salon-charcoal">₹ {p.purchase_price}</span>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdjustingProduct(p);
                        setShowAdjustModal(true);
                      }}
                      className="mt-1 block text-[10px] text-salon-gold-dark hover:underline font-semibold"
                    >
                      + Adjust Stock
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Stock Ledger History Drawer */}
        <div className="bg-white rounded-2xl border border-salon-border shadow-luxury p-5 flex flex-col justify-between">
          {selectedProductId ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-salon-border">
                <h3 className="font-serif font-bold text-base text-salon-charcoal flex items-center gap-1.5">
                  <History className="w-4 h-4 text-salon-gold" />
                  Stock Movement Ledger
                </h3>
                <p className="text-xs text-gray-500">Audit trail of receipts, sales and service deductions.</p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {stockLedger.length > 0 ? (
                  stockLedger.map((l: any) => (
                    <div
                      key={l.id}
                      className="p-2.5 rounded-xl bg-salon-ivory border border-salon-border text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold text-[10px] uppercase ${
                            l.type === "SALE" || l.type === "CONSUMPTION"
                              ? "text-rose-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {l.type === "CONSUMPTION" ? "Service Used" : l.type}
                        </span>
                        <span className="text-[10px] text-gray-400">{l.date.split("T")[0]}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">{l.notes || "Recorded transaction"}</span>
                        <span className="font-bold">
                          {l.qty_out > 0 ? `-${l.qty_out}` : `+${l.qty_in}`} (Bal: {l.balance})
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-6 text-center">No ledger transactions recorded yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-xs">
              Select an item on the left to inspect its complete stock audit trail and service consumption records.
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Adjust Stock: {adjustingProduct.name}
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                adjustMutation.mutate({
                  product_id: adjustingProduct.id,
                  adjustment_type: adjustForm.adjustment_type,
                  quantity: adjustForm.quantity,
                  notes: adjustForm.notes,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustForm.adjustment_type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                >
                  <option value="PURCHASE">Purchase Replenishment (+ Inflow)</option>
                  <option value="ADJUSTMENT">Physical Audit Count Reconciliation</option>
                  <option value="DAMAGE">Spillage / Damage / Expiry (- Deduction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity ({adjustingProduct.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes / Supplier Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received from L'Oréal distributor invoice #784"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-salon-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {adjustMutation.isPending ? "Updating..." : "Commit Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Add New Inventory Item
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addProductMutation.mutate({
                  ...newProdForm,
                  category_id: newProdForm.category_id || categories[0]?.id,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Item Type *
                </label>
                <select
                  value={newProdForm.product_type}
                  onChange={(e) => setNewProdForm({ ...newProdForm, product_type: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                >
                  <option value="RETAIL">Retail Product (Sold to Salon Clients)</option>
                  <option value="CONSUMABLE">Consumable (Used in Treatments)</option>
                  <option value="BOTH">Both (Sold & Used)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moroccan Argan Oil 100ml"
                  value={newProdForm.name}
                  onChange={(e) => setNewProdForm({ ...newProdForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="L'Oréal, O3+, etc."
                    value={newProdForm.brand}
                    onChange={(e) => setNewProdForm({ ...newProdForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={newProdForm.unit}
                    onChange={(e) => setNewProdForm({ ...newProdForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  >
                    <option value="PIECE">Piece / Box</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="ML">ML</option>
                    <option value="GRAM">Gram</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={newProdForm.purchase_price}
                    onChange={(e) => setNewProdForm({ ...newProdForm, purchase_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Retail Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newProdForm.retail_price}
                    onChange={(e) => setNewProdForm({ ...newProdForm, retail_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Opening Stock
                  </label>
                  <input
                    type="number"
                    value={newProdForm.current_stock}
                    onChange={(e) => setNewProdForm({ ...newProdForm, current_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    value={newProdForm.reorder_level}
                    onChange={(e) => setNewProdForm({ ...newProdForm, reorder_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
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
                  disabled={addProductMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {addProductMutation.isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

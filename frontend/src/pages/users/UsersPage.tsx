import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  UserCheck,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Key,
} from "lucide-react";
import { apiClient } from "../../api/client";
import { User, UserRole } from "../../types";

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
    role: "RECEPTIONIST",
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => (await apiClient.get("/auth/me")).data,
  });

  const addUserMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.post("/auth/users", payload)).data,
    onSuccess: () => {
      alert("New user created successfully!");
      setShowAddModal(false);
      setFormData({
        email: "",
        full_name: "",
        phone: "",
        password: "",
        role: "RECEPTIONIST",
      });
    },
    onError: (err: any) => alert("Failed to create user: " + (err.response?.data?.detail || err.message)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUserMutation.mutate(formData);
  };

  const roles = [
    { name: "OWNER", desc: "Full business access, reports, user management and settings" },
    { name: "MANAGER", desc: "Appointments, customers, staff, services and daily reports" },
    { name: "RECEPTIONIST", desc: "Appointments, customer registration and POS checkout" },
    { name: "CASHIER", desc: "POS billing, payment collection and invoice printing" },
    { name: "BEAUTICIAN", desc: "Assigned appointments, service status and personal commissions" },
    { name: "INVENTORY_MANAGER", desc: "Products, consumables, stock adjustments and receipts" },
  ];

  const permissionsMatrix = [
    { feature: "Executive Dashboard", owner: true, manager: true, receptionist: true, cashier: false, beautician: false, inventory: false },
    { feature: "Manage Appointments", owner: true, manager: true, receptionist: true, cashier: false, beautician: true, inventory: false },
    { feature: "B2C POS Billing", owner: true, manager: true, receptionist: true, cashier: true, beautician: false, inventory: false },
    { feature: "Customer CRM", owner: true, manager: true, receptionist: true, cashier: false, beautician: false, inventory: false },
    { feature: "Service Catalog Editing", owner: true, manager: true, receptionist: false, cashier: false, beautician: false, inventory: false },
    { feature: "Staff Roster & Shifts", owner: true, manager: true, receptionist: false, cashier: false, beautician: false, inventory: false },
    { feature: "Inventory & Stock Audit", owner: true, manager: true, receptionist: false, cashier: false, beautician: false, inventory: true },
    { feature: "Operating Expenses", owner: true, manager: true, receptionist: false, cashier: false, beautician: false, inventory: false },
    { feature: "Financial Reports & Tax", owner: true, manager: false, receptionist: false, cashier: false, beautician: false, inventory: false },
    { feature: "Settings & Reset", owner: true, manager: false, receptionist: false, cashier: false, beautician: false, inventory: false },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-salon-charcoal">
            User Roles & Permissions (RBAC)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Backend API-enforced role-based access control protecting client data and billing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-salon-charcoal text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-salon-gold" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Role Definitions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.name} className="bg-white p-4 rounded-2xl border border-salon-border shadow-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-salon-gold" />
              <span className="font-bold text-xs text-salon-charcoal uppercase">{r.name}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-salon-border shadow-luxury overflow-hidden">
        <div className="p-4 border-b border-salon-border">
          <h3 className="font-serif font-bold text-base text-salon-charcoal">
            System Permission Matrix
          </h3>
          <p className="text-xs text-gray-500">Access control enforced at both backend API dependencies and frontend navigation.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-salon-ivory text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Feature Module</th>
                <th className="p-3 text-center">Owner</th>
                <th className="p-3 text-center">Manager</th>
                <th className="p-3 text-center">Receptionist</th>
                <th className="p-3 text-center">Cashier</th>
                <th className="p-3 text-center">Beautician</th>
                <th className="p-3 text-center">Inventory Mgr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-salon-border">
              {permissionsMatrix.map((row) => (
                <tr key={row.feature} className="hover:bg-salon-ivory/20">
                  <td className="p-3 font-semibold text-salon-charcoal">{row.feature}</td>
                  <td className="p-3 text-center">
                    {row.owner ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.manager ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.receptionist ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.cashier ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.beautician ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.inventory ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-salon-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-salon-border">
              <h3 className="font-serif font-bold text-lg text-salon-charcoal">
                Create System User
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavita More"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="kavita@skrelax.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 8459890270"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-salon-ivory text-xs rounded-lg border border-salon-border focus:outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  disabled={addUserMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-salon-gold text-salon-charcoal hover:bg-salon-gold-light transition shadow-sm"
                >
                  {addUserMutation.isPending ? "Creating..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

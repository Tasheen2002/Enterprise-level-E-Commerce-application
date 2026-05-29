"use client";

import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { useAdminCustomers } from "../../../features/customers/hooks/useAdminCustomers";
import { CustomerRegistryTable } from "../../../features/customers/components/CustomerRegistryTable";
import { CustomerInfoCards } from "../../../features/customers/components/CustomerInfoCards";
import { CustomerWishlistModal } from "../../../features/customers/components/CustomerWishlistModal";
import { useModal } from "@/providers/ModalProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { UserListItem } from "../../../features/customers/types";

export default function CustomersPage() {
  const {
    users,
    total,
    page,
    totalPages,
    loading,
    searchTerm,
    statusFilter,
    roleFilter,
    setPage,
    setSearchTerm,
    setStatusFilter,
    setRoleFilter,
    updateStatus,
    deleteCustomer,
  } = useAdminCustomers();

  const { openModal, closeModal } = useModal();
  const [wishlistTargetCustomer, setWishlistTargetCustomer] = useState<UserListItem | null>(null);

  const handleUpdateStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    openModal(
      <ConfirmModal
        title={`${newStatus === "blocked" ? "Restrict" : "Restore"} Member Access`}
        message={`Are you sure you want to ${newStatus} this member? ${newStatus === "blocked" ? "They will lose access to their account immediately." : "They will regain full access to the boutique."}`}
        confirmLabel={newStatus === "blocked" ? "Restrict Access" : "Restore Access"}
        variant={newStatus === "blocked" ? "danger" : "info"}
        onConfirm={async () => {
          try {
            await updateStatus(id, newStatus);
          } finally {
            closeModal();
          }
        }}
        onClose={closeModal}
      />
    );
  };

  const handleDeleteUser = (id: string) => {
    openModal(
      <ConfirmModal
        title="Permanently Delete Member"
        message="CRITICAL: This action cannot be undone. All orders, profiles, and associated data will be permanently purged or anonymized."
        confirmLabel="Delete Permanently"
        variant="danger"
        onConfirm={async () => {
          try {
            await deleteCustomer(id);
          } finally {
            closeModal();
          }
        }}
        onClose={closeModal}
      />
    );
  };

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-serif italic text-charcoal mb-2">Customer Registry</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/40 font-bold">Manage Boutique Members & Access</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold mb-1">Total Members</p>
          <p className="text-2xl font-serif text-charcoal">{total}</p>
        </div>
      </div>

      <div className="bg-[#EBE6D9]/50 border border-charcoal/5 p-6 rounded-xl flex flex-wrap gap-6 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-white/60 border border-charcoal/10 pl-10 pr-4 py-2.5 text-[11px] focus:outline-none focus:border-[#C5A059] transition-colors rounded-xl"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-charcoal/40" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-b border-charcoal/10 py-1 text-[11px] uppercase tracking-wider focus:outline-none focus:border-charcoal/30 font-bold text-charcoal/60"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-transparent border-b border-charcoal/10 py-1 text-[11px] uppercase tracking-wider focus:outline-none focus:border-charcoal/30 font-bold text-charcoal/60"
          >
            <option value="all">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      <CustomerRegistryTable
        users={users}
        isLoading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteUser}
        onViewWishlist={(user) => setWishlistTargetCustomer(user)}
      />

      <CustomerInfoCards />

      <CustomerWishlistModal
        isOpen={!!wishlistTargetCustomer}
        customer={wishlistTargetCustomer}
        onClose={() => setWishlistTargetCustomer(null)}
      />
    </div>
  );
}

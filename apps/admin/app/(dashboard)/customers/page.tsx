"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { api, unwrap } from "../../../lib/api-client";
import { toast } from "sonner";
import { useModal } from "@/providers/ModalProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface UserListItem {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
}

export default function CustomersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const { openModal, closeModal } = useModal();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.GET("/api/v1/admin/users", {
        params: {
          query: {
            page,
            limit: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
            search: searchTerm || undefined,
            status: statusFilter !== "all" ? (statusFilter as "active" | "inactive" | "blocked") : undefined,
            role: roleFilter !== "all" ? (roleFilter as "GUEST" | "CUSTOMER" | "ADMIN" | "INVENTORY_STAFF" | "CUSTOMER_SERVICE" | "ANALYST" | "VENDOR") : undefined,
          }
        }
      });

      if (error) throw new Error((error as ApiErrorBody).message || "Failed to fetch customers");
      if (!data) throw new Error("No data received from registry");
      
      const result = unwrap(data) as PaginatedResponse;
      setUsers(result.items as UserListItem[]);
      setTotal(result.total || 0);
      setTotalPages(Math.ceil((result.total || 0) / (result.limit || 10)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    
    openModal(
      <ConfirmModal
        title={`${newStatus === 'blocked' ? 'Restrict' : 'Restore'} Member Access`}
        message={`Are you sure you want to ${newStatus} this member? ${newStatus === 'blocked' ? 'They will lose access to their account immediately.' : 'They will regain full access to the boutique.'}`}
        confirmLabel={newStatus === 'blocked' ? "Restrict Access" : "Restore Access"}
        variant={newStatus === 'blocked' ? "danger" : "info"}
        onConfirm={async () => {
          try {
            const { data, error } = await api.PATCH("/api/v1/users/{userId}/status", {
              params: { path: { userId: id } },
              body: { status: newStatus as "active" | "inactive" | "blocked" }
            });
            if (error) throw new Error((error as ApiErrorBody).message);
            if (!data) throw new Error("No response from server");
            unwrap(data);
            toast.success(`Member status updated to ${newStatus}`);
            fetchUsers();
          } catch (err: unknown) {
            toast.error((err as Error).message || "Failed to update user status");
          }
        }}
        onClose={() => closeModal()}
      />
    );
  };

  const handleDeleteUser = async (id: string) => {
    openModal(
      <ConfirmModal
        title="Permanently Delete Member"
        message="CRITICAL: This action cannot be undone. All orders, profiles, and associated data will be permanently purged or anonymized."
        confirmLabel="Delete Permanently"
        variant="danger"
        onConfirm={async () => {
          try {
            const { data, error } = await api.DELETE("/api/v1/users/{userId}", {
              params: { path: { userId: id } }
            });

            if (error) throw new Error((error as ApiErrorBody).message);
            toast.success("Member successfully purged from registry");
            fetchUsers();
          } catch (err: unknown) {
            toast.error((err as Error).message || "Failed to delete user");
          }
        }}
        onClose={() => closeModal()}
      />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "text-green-600 bg-green-50 border-green-100";
      case "blocked": return "text-red-600 bg-red-50 border-red-100";
      case "suspended": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  return (
    <div className="p-10 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-serif italic text-charcoal mb-2">Customer Registry</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/40 font-bold">
            Manage Boutique Members & Access
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold mb-1">Total Members</p>
          <p className="text-2xl font-serif text-charcoal">{total}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#EBE6D9]/50 border border-charcoal/5 p-6 rounded-sm flex flex-wrap gap-6 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-white/60 border border-charcoal/10 pl-10 pr-4 py-2.5 text-[11px] focus:outline-none focus:border-[#C5A059] transition-colors rounded-sm"
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

      {/* Main List */}
      <div className="bg-[#EBE6D9] border border-charcoal/5 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-charcoal/[0.03] border-b border-charcoal/5">
              <th className="px-8 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">Member</th>
              <th className="px-4 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">Role & Type</th>
              <th className="px-4 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">Status</th>
              <th className="px-4 py-5 text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">Joined</th>
              <th className="px-8 py-5 text-right text-[9px] uppercase tracking-widest text-charcoal/65 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-[11px] text-charcoal/40 italic">
                  Consulting the registry...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-[11px] text-charcoal/40 italic">
                  No members found matching your criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id || user.email} className="hover:bg-[#F9F8F4]/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F5F1E8] flex items-center justify-center border border-charcoal/5">
                        <User className="w-4 h-4 text-charcoal/30" strokeWidth={1.2} />
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-charcoal flex items-center gap-2">
                          {user.firstName ? `${user.firstName} ${user.lastName}` : "Anonymous Artisan"}
                          {user.isGuest && (
                            <span className="text-[8px] bg-charcoal/5 text-charcoal/40 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Guest</span>
                          )}
                        </div>
                        <div className="text-[11px] text-charcoal/70 lowercase">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">
                        {user.role.replace("_", " ")}
                      </span>
                      {user.emailVerified && (
                        <span className="text-[8px] text-green-700/85 font-bold flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[10px] text-charcoal/80">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleUpdateStatus(user.id, user.status)}
                        className={`p-2 transition-colors ${user.status === 'active' ? 'text-charcoal/20 hover:text-red-500' : 'text-green-500 hover:text-green-600'}`}
                        title={user.status === 'active' ? "Block User" : "Activate User"}
                      >
                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-charcoal/20 hover:text-red-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-8 py-4 bg-charcoal/[0.03] border-t border-charcoal/5 flex justify-between items-center">
            <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">
              Showing page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-charcoal/10 rounded-sm hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-charcoal/10 rounded-sm hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#EBE6D9] border border-charcoal/5 rounded-sm shadow-sm group hover:bg-[#EBE6D9]/80 transition-all duration-500">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/60 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy/50 transition-colors duration-500" /> Security Protocol
          </h3>
          <p className="text-[10px] text-charcoal/75 leading-relaxed">
            Blocking a user will immediately terminate all active sessions and prevent future authentication until restored.
          </p>
        </div>
        <div className="p-6 bg-[#EBE6D9] border border-charcoal/5 rounded-sm shadow-sm group hover:bg-[#EBE6D9]/80 transition-all duration-500">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/60 mb-3 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy/50 transition-colors duration-500" /> Communication
          </h3>
          <p className="text-[10px] text-charcoal/75 leading-relaxed">
            Email verification status is managed by the system. Manual overrides should only be used after identity verification.
          </p>
        </div>
        <div className="p-6 bg-[#EBE6D9] border border-charcoal/5 rounded-sm shadow-sm group hover:bg-[#EBE6D9]/80 transition-all duration-500">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/60 mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy/50 transition-colors duration-500" /> Data Integrity
          </h3>
          <p className="text-[10px] text-charcoal/75 leading-relaxed">
            User deletion is permanent. All orders, addresses, and profiles linked to this ID will be purged or anonymized.
          </p>
        </div>
      </div>
    </div>
  );
}

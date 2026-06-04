import { useState, useEffect, useCallback } from "react";
import { customersApi } from "../api";
import { UserListItem } from "../types";
import { toast } from "sonner";

export function useAdminCustomers() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await customersApi.getUsers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        role: roleFilter !== "all" ? (roleFilter as any) : undefined,
      });
      setUsers(result.items);
      setTotal(result.total || 0);
      setTotalPages(Math.ceil((result.total || 0) / 10));
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const updateStatus = async (id: string, newStatus: "active" | "inactive" | "blocked") => {
    try {
      await customersApi.updateUserStatus(id, newStatus);
      toast.success(`Member status updated to ${newStatus}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customersApi.deleteUser(id);
      toast.success("Member successfully purged from registry");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
      throw err;
    }
  };

  return {
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
    refetch: fetchUsers,
    updateStatus,
    deleteCustomer,
  };
}

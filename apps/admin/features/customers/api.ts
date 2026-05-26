import { api, unwrap } from "../../lib/api-client";
import { PaginatedUserResponse } from "./types";

export const customersApi = {
  /**
   * Fetch customer list with pagination, search, status, and role filters
   */
  async getUsers(query: {
    page: number;
    limit: number;
    sortBy?: "createdAt" | "email";
    sortOrder?: "asc" | "desc";
    search?: string;
    status?: "active" | "inactive" | "blocked";
    role?: "GUEST" | "CUSTOMER" | "ADMIN" | "INVENTORY_STAFF" | "CUSTOMER_SERVICE" | "ANALYST" | "VENDOR";
  }): Promise<PaginatedUserResponse> {
    const { data, error } = await api.GET("/api/v1/admin/users", {
      params: {
        query: {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy || "createdAt",
          sortOrder: query.sortOrder || "desc",
          search: query.search || undefined,
          status: query.status || undefined,
          role: query.role || undefined,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("No data received from registry");
    }

    return unwrap(data) as PaginatedUserResponse;
  },

  /**
   * Update member access status (e.g. block or activate)
   */
  async updateUserStatus(
    userId: string,
    status: "active" | "inactive" | "blocked"
  ): Promise<void> {
    const { data, error } = await api.PATCH("/api/v1/users/{userId}/status", {
      params: { path: { userId } },
      body: { status },
    });

    if (error) {
      throw error;
    }

    unwrap(data);
  },

  /**
   * Delete a member permanently
   */
  async deleteUser(userId: string): Promise<void> {
    const { error } = await api.DELETE("/api/v1/users/{userId}", {
      params: { path: { userId } },
    });

    if (error) {
      throw error;
    }
  },
};

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

  /**
   * Fetch a customer's wishlists
   */
  async getCustomerWishlists(userId: string): Promise<any[]> {
    const res = await api.GET("/api/v1/engagement/users/{userId}/wishlists" as any, {
      params: { path: { userId } }
    } as any) as any;
    if (res.data?.success && res.data.data?.items) {
      return res.data.data.items;
    }
    return [];
  },

  /**
   * Fetch items inside a wishlist
   */
  async getWishlistItems(wishlistId: string): Promise<any[]> {
    const res = await api.GET("/api/v1/engagement/wishlists/{wishlistId}/items" as any, {
      params: { path: { wishlistId } }
    } as any) as any;
    if (res.data?.success && res.data.data?.items) {
      return res.data.data.items;
    }
    return [];
  },

  /**
   * Fetch variant details
   */
  async getVariant(variantId: string): Promise<any> {
    const res = await api.GET("/api/v1/variants/{variantId}" as any, {
      params: { path: { variantId } }
    } as any) as any;
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  /**
   * Fetch product details
   */
  async getProduct(productId: string): Promise<any> {
    const res = await api.GET("/api/v1/products/{productId}" as any, {
      params: { path: { productId } }
    } as any) as any;
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  /**
   * Fetch variant media assets
   */
  async getVariantMedia(variantId: string): Promise<any[]> {
    const res = await api.GET("/api/v1/variants/{variantId}/media" as any, {
      params: { path: { variantId } }
    } as any) as any;
    if (res.data?.success && res.data.data?.mediaAssets) {
      return res.data.data.mediaAssets;
    }
    return [];
  },

  /**
   * Fetch total available stock for a variant
   */
  async getVariantStock(variantId: string): Promise<number> {
    const res = await api.GET("/api/v1/stocks/{variantId}/total" as any, {
      params: { path: { variantId } }
    } as any) as any;
    if (res.data?.success && typeof res.data.data?.total === "number") {
      return res.data.data.total;
    }
    return 0;
  }
};


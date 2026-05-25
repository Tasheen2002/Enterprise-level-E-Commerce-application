import { api } from "../../lib/api-client";
import { Contact, Supplier, POItem, PurchaseOrder, Stock } from "./types";

export const inventoryApi = {
  /**
   * Fetch registered B2B manufacturers
   */
  async getSuppliers(): Promise<Supplier[]> {
    const res = await api.GET("/api/v1/suppliers", { params: { query: { limit: 100, offset: 0 } } });
    if (res.data?.success && res.data.data.items) {
      return res.data.data.items as Supplier[];
    }
    return [];
  },

  /**
   * Register a new partner manufacturer
   */
  async createSupplier(name: string, leadTimeDays: number, contacts?: Contact[]): Promise<Supplier> {
    const res = await api.POST("/api/v1/suppliers", {
      body: { name, leadTimeDays, contacts }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to register supplier");
    }
    return res.data?.data as Supplier;
  },

  /**
   * Fetch purchase orders with status filtering
   */
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const res = await api.GET("/api/v1/purchase-orders", {
      params: { query: { limit: 100, offset: 0, sortBy: "createdAt", sortOrder: "desc" } }
    });
    if (res.data?.success && res.data.data.items) {
      return res.data.data.items as PurchaseOrder[];
    }
    return [];
  },

  /**
   * Fetch line items inside a PO
   */
  async getPOItems(poId: string): Promise<POItem[]> {
    const res = await api.GET("/api/v1/purchase-orders/{poId}/items", {
      params: { path: { poId } }
    }) as any;
    if (res.data?.success && res.data.data) {
      return res.data.data as POItem[];
    }
    return [];
  },

  /**
   * Draft a complete PO with pre-populated variants
   */
  async createPOWithItems(supplierId: string, eta?: string, items: Array<{ variantId: string; orderedQty: number }> = []): Promise<PurchaseOrder> {
    const res = await api.POST("/api/v1/purchase-orders/full", {
      body: { supplierId, eta: eta as any, items }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to create Purchase Order");
    }
    return res.data?.data as PurchaseOrder;
  },

  /**
   * Update the status workflow of a PO
   */
  async updatePOStatus(poId: string, status: "sent" | "cancelled"): Promise<PurchaseOrder> {
    const res = await api.PATCH("/api/v1/purchase-orders/{poId}/status", {
      params: { path: { poId } },
      body: { status }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to update Purchase Order status");
    }
    return res.data.data as PurchaseOrder;
  },

  /**
   * Receive incoming shipment counts and increment physical inventory
   */
  async receivePOItems(poId: string, locationId: string, items: Array<{ variantId: string; receivedQty: number }>): Promise<PurchaseOrder> {
    const res = await api.POST("/api/v1/purchase-orders/{poId}/receive", {
      params: { path: { poId } },
      body: { locationId, items }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to process stock receival");
    }
    return res.data.data as PurchaseOrder;
  },

  /**
   * Fetch active locations (warehouses/boutiques)
   */
  async getLocations() {
    const res = await api.GET("/api/v1/locations", { params: { query: { limit: 100, offset: 0 } } });
    if (res.data?.success && res.data.data.items) {
      return res.data.data.items;
    }
    return [];
  },

  /**
   * Fetch products to map SKUs & Titles inside drawers
   */
  async getProducts() {
    const res = await api.GET("/api/v1/products", { params: { query: { limit: 100, page: 1, sortBy: "createdAt", sortOrder: "desc" } } });
    if (res.data?.success && res.data.data.items) {
      return res.data.data.items;
    }
    return [];
  },

  /**
   * Fetch product variants
   */
  async getProductVariants(productId: string) {
    const res = await api.GET("/api/v1/products/{productId}/variants", {
      params: { path: { productId }, query: { limit: 100, page: 1, sortBy: "createdAt", sortOrder: "desc" } }
    });
    if (res.data?.success && res.data.data.items) {
      return res.data.data.items;
    }
    return [];
  },

  /**
   * Fetch all active stocks
   */
  async fetchStocks(limit: number = 100, offset: number = 0): Promise<Stock[]> {
    const res = await api.GET("/api/v1/stocks", {
      params: { query: { limit, offset, sortBy: "available", sortOrder: "desc" } }
    });
    if (res.data?.success && res.data.data && 'items' in res.data.data) {
      return res.data.data.items as Stock[];
    }
    return [];
  },

  /**
   * Adjust variant quantity delta with reason
   */
  async adjustStock(variantId: string, locationId: string, quantityDelta: number, reason: "return" | "adjustment" | "po" | "order" | "damage" | "theft"): Promise<Stock> {
    const res = await api.POST("/api/v1/stocks/adjust", {
      body: { variantId, locationId, quantityDelta, reason }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Adjustment failed");
    }
    return res.data?.data as Stock;
  },

  /**
   * Add variant initial stock quantity
   */
  async addStock(variantId: string, locationId: string, quantity: number, reason: "return" | "adjustment" | "po" | "order" | "damage" | "theft"): Promise<Stock> {
    const res = await api.POST("/api/v1/stocks/add", {
      body: { variantId, locationId, quantity, reason }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Initial stock addition failed");
    }
    return res.data?.data as Stock;
  },

  /**
   * Modify variant safety stock and low-stock alerts thresholds at a location
   */
  async setStockThresholds(variantId: string, locationId: string, lowStockThreshold: number, safetyStock: number): Promise<Stock> {
    const res = await api.PATCH("/api/v1/stocks/{variantId}/{locationId}/thresholds", {
      params: { path: { variantId, locationId } },
      body: { lowStockThreshold, safetyStock }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to update safety thresholds");
    }
    return res.data?.data as Stock;
  },

  /**
   * Register a new warehouse facility or boutique store
   */
  async createLocation(name: string, type: "warehouse" | "store" | "vendor") {
    const res = await api.POST("/api/v1/locations", {
      body: { name, type }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to create location");
    }
    return res.data?.data;
  }
};

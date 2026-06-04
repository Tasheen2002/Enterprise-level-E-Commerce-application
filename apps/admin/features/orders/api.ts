import { api, unwrap } from "../../lib/api-client";

export const ordersApi = {
  /**
   * Fetch all orders with query parameters
   */
  async getOrders(query?: {
    limit?: number;
    offset?: number;
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: "createdAt" | "updatedAt" | "orderNumber";
    sortOrder?: "asc" | "desc";
  }): Promise<any> {
    const res = await (api as any).GET("/api/v1/orders", {
      params: {
        query: {
          limit: query?.limit ?? 50,
          offset: query?.offset ?? 0,
          userId: query?.userId,
          status: query?.status,
          startDate: query?.startDate?.toISOString(),
          endDate: query?.endDate?.toISOString(),
          sortBy: query?.sortBy ?? "createdAt",
          sortOrder: query?.sortOrder ?? "desc",
        }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Fetch administrative dashboard overview metrics
   */
  async getDashboardMetrics(): Promise<any> {
    const res = await (api as any).GET("/api/v1/orders/dashboard/metrics");
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Fetch recent administrative notifications
   */
  async getNotifications(): Promise<any> {
    const res = await (api as any).GET("/api/v1/notifications");
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Mark a specific notification as read
   */
  async markNotificationRead(id: string): Promise<any> {
    const res = await (api as any).PATCH("/api/v1/notifications/{id}/read", {
      params: {
        path: { id }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<any> {
    const res = await (api as any).POST("/api/v1/notifications/read-all");
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Fetch a single order by its ID
   */
  async getOrder(orderId: string): Promise<any> {
    const res = await (api as any).GET("/api/v1/orders/{orderId}", {
      params: {
        path: { orderId }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Override order status (Admin override)
   */
  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const res = await (api as any).PATCH("/api/v1/orders/{orderId}/status", {
      params: {
        path: { orderId }
      },
      body: { status } as any
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Update order financials (tax, shipping, discount)
   */
  async updateOrderTotals(orderId: string, totals: { tax: number; shipping: number; discount: number }): Promise<any> {
    const res = await (api as any).PATCH("/api/v1/orders/{orderId}/totals", {
      params: {
        path: { orderId }
      },
      body: { totals }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Mark order as paid
   */
  async markOrderAsPaid(orderId: string): Promise<any> {
    const res = await (api as any).POST("/api/v1/orders/{orderId}/mark-paid", {
      params: {
        path: { orderId }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Mark order as fulfilled
   */
  async markOrderAsFulfilled(orderId: string): Promise<any> {
    const res = await (api as any).POST("/api/v1/orders/{orderId}/mark-fulfilled", {
      params: {
        path: { orderId }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<any> {
    const res = await (api as any).POST("/api/v1/orders/{orderId}/cancel", {
      params: {
        path: { orderId }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Create shipment packaging for order
   */
  async createShipment(orderId: string, body: {
    carrier?: string;
    service?: string;
    trackingNumber?: string;
    giftReceipt?: boolean;
    pickupLocationId?: string;
  }): Promise<any> {
    const res = await (api as any).POST("/api/v1/orders/{orderId}/shipments", {
      params: {
        path: { orderId }
      },
      body: {
        carrier: body.carrier,
        service: body.service,
        trackingNumber: body.trackingNumber,
        giftReceipt: body.giftReceipt ?? false,
        pickupLocationId: body.pickupLocationId,
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Mark a shipment package as in transit
   */
  async markShipmentShipped(orderId: string, shipmentId: string, body: {
    carrier: string;
    service: string;
    trackingNumber: string;
  }): Promise<any> {
    const res = await (api as any).POST("/api/v1/orders/{orderId}/shipments/{shipmentId}/mark-shipped", {
      params: {
        path: { orderId, shipmentId }
      },
      body
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Mark a shipment package as delivered
   */
  async markShipmentDelivered(orderId: string, shipmentId: string, body?: {
    deliveredAt?: Date;
  }): Promise<any> {
    const res = await (api as any).POST("/api/v1/orders/{orderId}/shipments/{shipmentId}/mark-delivered", {
      params: {
        path: { orderId, shipmentId }
      },
      body: {
        deliveredAt: body?.deliveredAt?.toISOString()
      } as any
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Update carrier tracking information
   */
  async updateShipmentTracking(orderId: string, shipmentId: string, body: {
    trackingNumber: string;
    carrier?: string;
    service?: string;
  }): Promise<any> {
    const res = await (api as any).PATCH("/api/v1/orders/{orderId}/shipments/{shipmentId}/tracking", {
      params: {
        path: { orderId, shipmentId }
      },
      body
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Fetch chronological status updates timeline
   */
  async getOrderStatusHistory(orderId: string, query?: { limit?: number; offset?: number }): Promise<any> {
    const res = await (api as any).GET("/api/v1/orders/{orderId}/status-history", {
      params: {
        path: { orderId },
        query: {
          limit: query?.limit ?? 50,
          offset: query?.offset ?? 0
        }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Fetch order events system audit logs
   */
  async getOrderEvents(orderId: string, query?: { limit?: number; offset?: number }): Promise<any> {
    const res = await (api as any).GET("/api/v1/orders/{orderId}/events", {
      params: {
        path: { orderId },
        query: {
          limit: query?.limit ?? 50,
          offset: query?.offset ?? 0,
          sortBy: "createdAt",
          sortOrder: "desc"
        }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Fetch all preorders
   */
  async getPreorders(query?: { limit?: number; offset?: number }): Promise<any> {
    const res = await (api as any).GET("/api/v1/preorders", {
      params: {
        query: {
          limit: query?.limit ?? 50,
          offset: query?.offset ?? 0,
          sortBy: "releaseDate",
          sortOrder: "desc",
          filterType: "all"
        }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Fetch all backorders
   */
  async getBackorders(query?: { limit?: number; offset?: number }): Promise<any> {
    const res = await (api as any).GET("/api/v1/backorders", {
      params: {
        query: {
          limit: query?.limit ?? 50,
          offset: query?.offset ?? 0,
          sortBy: "promisedEta",
          sortOrder: "desc",
          filterType: "all"
        }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Update expected release date for preorder
   */
  async updatePreorderReleaseDate(orderItemId: string, releaseDate: Date): Promise<any> {
    const res = await (api as any).PATCH("/api/v1/preorders/{orderItemId}/release-date", {
      params: {
        path: { orderItemId }
      },
      body: { releaseDate: releaseDate.toISOString() }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Update promised ETA for backorder
   */
  async updateBackorderEta(orderItemId: string, promisedEta: Date): Promise<any> {
    const res = await (api as any).PATCH("/api/v1/backorders/{orderItemId}/eta", {
      params: {
        path: { orderItemId }
      },
      body: { promisedEta: promisedEta.toISOString() }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Send arrival notification flag to preorder customer
   */
  async notifyPreorder(orderItemId: string): Promise<any> {
    const res = await (api as any).POST("/api/v1/preorders/{orderItemId}/notify", {
      params: {
        path: { orderItemId }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  },

  /**
   * Send arrival notification flag to backorder customer
   */
  async notifyBackorder(orderItemId: string): Promise<any> {
    const res = await (api as any).POST("/api/v1/backorders/{orderItemId}/notify", {
      params: {
        path: { orderItemId }
      }
    });
    if (res.error) throw res.error;
    return unwrap(res.data!);
  }
};

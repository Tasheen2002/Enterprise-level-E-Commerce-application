"use client";

import React from "react";
import { OrderList } from "../../../features/orders/components/OrderList";
import { useAdminOrders } from "../../../features/orders/hooks/useAdminOrders";

export default function OrdersPage() {
  const { data: result, isLoading, refetch } = useAdminOrders();

  const orders = result?.items ?? [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-charcoal/40 font-bold uppercase tracking-widest">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span className="text-charcoal/80">Order Ledger</span>
          </div>
          <h1 className="text-3xl font-serif text-charcoal mt-1">Acquisition Order Ledger</h1>
          <p className="text-[11px] font-bold text-charcoal/70 uppercase tracking-widest mt-1">
            Audit, package, and dispatch luxury creations. Monitor payment verification and fulfillment tracks.
          </p>
        </div>
      </div>

      <OrderList
        orders={orders as any}
        isLoading={isLoading}
        onRefresh={refetch}
      />
    </div>
  );
}

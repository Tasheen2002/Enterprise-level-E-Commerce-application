"use client";

import { useAdminDashboardMetrics } from "../../orders/hooks/useAdminOrders";

export function TodaysPulseCard() {
  const { data, isLoading } = useAdminDashboardMetrics();

  // Fallbacks if data is not loaded or missing
  const ordersToday = data?.ordersToday !== undefined ? data.ordersToday : 0;
  const avgOrderValue = data?.avgOrderValue !== undefined ? data.avgOrderValue : 0;
  const itemsShipped = data?.itemsShipped !== undefined ? data.itemsShipped : 0;

  if (isLoading) {
    return (
      <div className="bg-charcoal rounded-2xl p-6 text-cream space-y-5 shadow-lg shadow-charcoal/20 animate-pulse">
        <div className="h-3.5 w-24 bg-cream/15 rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <div className="h-3 w-20 bg-cream/15 rounded" />
              <div className="h-6 w-12 bg-cream/15 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal rounded-2xl p-6 text-cream space-y-5 shadow-lg shadow-charcoal/20 group hover:bg-charcoal/95 transition-all duration-500 cursor-default border border-cream/5">
      <h3 className="text-[10px] text-cream/60 uppercase tracking-[0.25em] font-bold">Today&apos;s Pulse</h3>
      <div className="space-y-4">
        {/* Orders Today */}
        <div className="flex justify-between items-baseline group/row">
          <span className="text-[11px] text-cream/70 group-hover/row:text-cream transition-colors duration-300">Orders Today</span>
          <span className="text-2xl font-serif text-cream group-hover/row:text-gold transition-colors duration-300 tracking-tight">
            {ordersToday}
          </span>
        </div>
        <div className="h-px bg-cream/10" />

        {/* Average Order Value */}
        <div className="flex justify-between items-baseline group/row">
          <span className="text-[11px] text-cream/70 group-hover/row:text-cream transition-colors duration-300">Avg. Order Value</span>
          <span className="text-2xl font-serif text-cream group-hover/row:text-gold transition-colors duration-300 tracking-tight">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(avgOrderValue)}
          </span>
        </div>
        <div className="h-px bg-cream/10" />

        {/* Items Shipped */}
        <div className="flex justify-between items-baseline group/row">
          <span className="text-[11px] text-cream/70 group-hover/row:text-cream transition-colors duration-300">Items Shipped</span>
          <span className="text-2xl font-serif text-cream group-hover/row:text-gold transition-colors duration-300 tracking-tight">
            {itemsShipped}
          </span>
        </div>
      </div>
    </div>
  );
}

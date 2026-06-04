"use client";

import React from "react";
import { Clock, ArrowUpRight } from "lucide-react";
import { useAdminOrders } from "../../orders/hooks/useAdminOrders";
import Link from "next/link";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "min" : "mins"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("process") || normalized === "paid") {
    return "text-[#C5A059]"; // Gold
  }
  if (normalized.includes("ship") || normalized === "partially_shipped") {
    return "text-charcoal/70";
  }
  if (normalized.includes("deliver") || normalized === "fulfilled") {
    return "text-[#6F8F72]"; // Sage
  }
  if (normalized.includes("cancel")) {
    return "text-red-500";
  }
  if (normalized.includes("refund")) {
    return "text-stone-400";
  }
  return "text-charcoal/60";
}

export function RecentOrdersTable() {
  const { data, isLoading } = useAdminOrders({ limit: 5 });
  const orders = data?.items || [];

  if (isLoading) {
    return (
      <div className="bg-[#EBE6D9] rounded-2xl overflow-hidden shadow-sm border border-charcoal/5 animate-pulse">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[9px] text-charcoal/40 uppercase tracking-[0.2em] font-bold">
          <div className="col-span-3">Order</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 px-6 py-5 border-t border-charcoal/[0.04]">
            <div className="col-span-3"><div className="h-4 w-24 bg-charcoal/10 rounded" /></div>
            <div className="col-span-3"><div className="h-4 w-32 bg-charcoal/10 rounded" /></div>
            <div className="col-span-2"><div className="h-3.5 w-16 bg-charcoal/10 rounded" /></div>
            <div className="col-span-2"><div className="h-4 w-20 bg-charcoal/10 rounded" /></div>
            <div className="col-span-2 text-right flex justify-end"><div className="h-4 w-16 bg-charcoal/10 rounded" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-[#EBE6D9] rounded-2xl p-12 text-center border border-charcoal/5 flex flex-col items-center justify-center gap-3">
        <p className="text-[12px] font-serif italic text-charcoal/60">No recent orders recorded.</p>
        <p className="text-[9px] text-charcoal/40 uppercase tracking-[0.2em] font-bold">Your boutique catalog will display live sales once customers begin checking out.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#EBE6D9] rounded-2xl overflow-hidden shadow-sm border border-charcoal/5">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[9px] text-charcoal/70 uppercase tracking-[0.2em] font-bold">
        <div className="col-span-3">Order</div>
        <div className="col-span-3">Customer</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2 text-right">Amount</div>
      </div>

      {/* Table Rows */}
      {orders.map((order: any) => {
        const shipping = order.address?.shippingAddress;
        const customerName = shipping
          ? `${shipping.firstName} ${shipping.lastName}`
          : (order.address?.billingAddress
              ? `${order.address.billingAddress.firstName} ${order.address.billingAddress.lastName}`
              : "Guest Customer");

        const displayOrderNumber = order.orderNumber.length > 15
          ? `#${order.orderNumber.slice(0, 14)}...`
          : `#${order.orderNumber}`;

        const totalFormatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: order.currency || "USD",
        }).format(order.totals.total);

        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="grid grid-cols-12 gap-4 px-6 py-5 border-t border-charcoal/[0.04] hover:bg-[#EFEBE0]/40 transition-colors duration-300 group cursor-pointer items-center"
          >
            <div className="col-span-3">
              <p className="text-[12px] text-charcoal font-medium truncate">{displayOrderNumber}</p>
            </div>
            <div className="col-span-3">
              <p className="text-[12px] text-charcoal/80 font-medium truncate">{customerName}</p>
            </div>
            <div className="col-span-2">
              <span className={`text-[9px] uppercase tracking-[0.15em] font-bold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-charcoal/40" strokeWidth={1.2} />
              <p className="text-[11px] text-charcoal/60 font-medium truncate">{formatRelativeTime(order.createdAt)}</p>
            </div>
            <div className="col-span-2 text-right flex items-center justify-end gap-1">
              <p className="text-[13px] font-serif text-charcoal group-hover:text-burgundy transition-colors duration-300">
                {totalFormatted}
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-burgundy group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 opacity-0 group-hover:opacity-100" strokeWidth={1.5} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

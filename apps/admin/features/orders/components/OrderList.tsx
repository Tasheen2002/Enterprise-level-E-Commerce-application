"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, Eye, ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@tasheen/ui";

interface OrderItem {
  variantId: string;
  quantity: number;
  productSnapshot: {
    name: string;
    sku: string;
    price: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  items: OrderItem[];
  totals: {
    total: number;
  };
  status: string;
  source: string;
  createdAt: string;
}

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function OrderList({ orders, isLoading, onRefresh }: OrderListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  const filteredOrders = orders.filter((order) => {
    // 1. Text Search
    const searchString = `${order.orderNumber} ${order.userId || ""} ${order.guestToken || ""}`.toLowerCase();
    if (searchQuery && !searchString.includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 2. Status Filter
    if (statusFilter !== "ALL" && order.status.toUpperCase() !== statusFilter) {
      return false;
    }

    // 3. Source Filter
    if (sourceFilter !== "ALL" && order.source.toUpperCase() !== sourceFilter) {
      return false;
    }

    return true;
  });

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "CREATED":
        return "bg-blue-50 text-blue-700 border border-blue-200/50";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border border-amber-200/50";
      case "PAID":
      case "CONFIRMED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
      case "PROCESSING":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200/50";
      case "SHIPPED":
        return "bg-purple-50 text-purple-700 border border-purple-200/50";
      case "DELIVERED":
      case "FULFILLED":
        return "bg-green-50 text-green-700 border border-green-200/50";
      case "CANCELLED":
      case "REFUNDED":
        return "bg-red-50 text-red-700 border border-red-200/50";
      case "PARTIALLY_RETURNED":
        return "bg-orange-50 text-orange-700 border border-orange-200/50";
      default:
        return "bg-stone-50 text-stone-700 border border-stone-200/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        
        {/* Left Side: Search and Filters */}
        <div className="w-full lg:flex-1 flex flex-col sm:flex-row gap-3 items-center">
          
          {/* Text Search */}
          <div className="relative flex-1 min-w-[200px] w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search order number or customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F9F8F4] border border-charcoal/10 pl-10 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-charcoal focus:outline-none focus:border-burgundy rounded-full transition-colors"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-[155px] shrink-0 bg-[#F9F8F4] border border-charcoal/10 pl-3 pr-6 py-2.5 text-[10px] font-bold uppercase tracking-normal text-charcoal focus:outline-none focus:border-burgundy rounded-full transition-colors cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FULFILLED">Fulfilled (Legacy)</option>
            <option value="PARTIALLY_RETURNED">Partially Returned</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Source Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full sm:w-[155px] shrink-0 bg-[#F9F8F4] border border-charcoal/10 pl-3 pr-6 py-2.5 text-[10px] font-bold uppercase tracking-normal text-charcoal focus:outline-none focus:border-burgundy rounded-full transition-colors cursor-pointer"
          >
            <option value="ALL">All Sources</option>
            <option value="WEB">Web Storefront</option>
            <option value="POS">Retail POS</option>
            <option value="MOBILE">Mobile App</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="border border-charcoal/10 hover:border-charcoal/20 bg-[#F9F8F4] p-3 text-charcoal hover:bg-charcoal/5 rounded-full transition-colors flex items-center justify-center shrink-0"
            title="Refresh order registry"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white border border-charcoal/5 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[1000px]">
          <thead>
            <tr className="border-b border-sand/20 bg-[#EBE6D9]/40">
              <th className="pl-8 pr-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60">Order Number</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60">Purchaser ID</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60">Date Placed</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60">Sales Channel</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-center">Creations</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-right">Totals</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-center">Fulfillment Status</th>
              <th className="pl-6 pr-8 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/10">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="h-6 w-6 text-gold animate-spin" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-muted/50">Recalling Registry...</span>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-xs text-slate-muted/50 font-light">
                  No matching order archives were discovered.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#F9F8F4]/60 transition-colors duration-250">
                  <td className="pl-8 pr-6 py-4">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs font-mono font-bold text-charcoal hover:text-gold transition-colors block"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono text-slate-muted block truncate max-w-[120px]">
                      {order.userId ? (
                        <span className="text-charcoal font-medium">User: {order.userId.slice(0, 8)}</span>
                      ) : (
                        <span className="italic text-slate-muted/60">Guest Checkout</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-charcoal">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-muted">
                      {order.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-charcoal font-medium">
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-charcoal font-bold">
                      ${order.totals.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 inline-block",
                      getStatusBadgeStyles(order.status)
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="pl-6 pr-8 py-4 text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-gold hover:text-charcoal transition-colors group"
                    >
                      Audit
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

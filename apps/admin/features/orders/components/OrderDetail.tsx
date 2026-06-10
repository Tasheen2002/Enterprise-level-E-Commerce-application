"use client";

import React, { useState } from "react";
import {
  FileText,
  User,
  ShieldAlert,
  Clock,
  History,
  Activity,
  ChevronRight,
  RefreshCw,
  Edit2,
  Save,
} from "lucide-react";
import { Button, Input, FormField, cn } from "@tasheen/ui";
import { toast } from "sonner";
import type { OrderStatusHistoryEntry, OrderEventEntry } from "../types";

interface OrderItem {
  orderItemId: string;
  id?: string;
  variantId: string;
  quantity: number;
  productSnapshot: {
    name: string;
    sku: string;
    price: number;
  };
  isGift: boolean;
  giftMessage?: string;
}

interface AddressSnapshot {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  items: OrderItem[];
  address?: {
    shippingAddress: AddressSnapshot;
    billingAddress: AddressSnapshot;
  };
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  status: string;
  source: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailProps {
  order: Order;
  statusHistory: OrderStatusHistoryEntry[];
  events: OrderEventEntry[];
  onUpdateStatus: (status: string) => Promise<any>;
  onUpdateTotals: (totals: { tax: number; shipping: number; discount: number }) => Promise<any>;
  onMarkPaid: () => Promise<any>;
  onMarkFulfilled: () => Promise<any>;
  onCancel: () => Promise<any>;
}

export function OrderDetail({
  order,
  statusHistory,
  events,
  onUpdateStatus,
  onUpdateTotals,
  onMarkPaid,
  onMarkFulfilled,
  onCancel,
}: OrderDetailProps) {
  const [activeTimelineTab, setActiveTimelineTab] = useState<"history" | "events">("history");
  const [isEditingTotals, setIsEditingTotals] = useState(false);

  // Totals form states
  const [tax, setTax] = useState(String(order.totals.tax));
  const [shipping, setShipping] = useState(String(order.totals.shipping));
  const [discount, setDiscount] = useState(String(order.totals.discount));
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleUpdateTotalsSubmit = async () => {
    const taxNum = parseFloat(tax) || 0;
    const shippingNum = parseFloat(shipping) || 0;
    const discountNum = parseFloat(discount) || 0;

    setIsSubmitting(true);
    try {
      await onUpdateTotals({
        tax: taxNum,
        shipping: shippingNum,
        discount: discountNum,
      });
      toast.success("Order financial totals recalculated successfully.");
      setIsEditingTotals(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update totals.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (actionFn: () => Promise<any>, successMsg: string) => {
    setIsSubmitting(true);
    try {
      await actionFn();
      toast.success(successMsg);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Action request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const s = order.status.toLowerCase();
  const canCancel = s !== "cancelled" && s !== "refunded" && s !== "delivered" && s !== "fulfilled";
  const canMarkPaid = s === "created" || s === "pending";
  const canMarkFulfilled = s === "paid" || s === "processing" || s === "shipped";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Financials, Customer profile, items list */}
      <div className="lg:col-span-8 space-y-8">
        {/* Customer Profile & Channels Card */}
        <div className="bg-white border border-sand/20 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-sand/10 pb-2">
              <User className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <span className="text-[9px] uppercase font-bold tracking-widest text-charcoal">Customer Record</span>
            </div>
            {order.userId ? (
              <div className="text-xs space-y-2">
                <p className="text-slate-muted font-light">Registered Account ID:</p>
                <p className="font-mono font-bold text-stone-850 truncate">{order.userId}</p>
              </div>
            ) : (
              <div className="text-xs space-y-2">
                <p className="text-slate-muted font-light">Checkout Mode:</p>
                <p className="font-mono font-bold text-stone-850 italic">Guest Checkout Session</p>
                <p className="text-[10px] text-slate-muted/65">Guest Token: <span className="font-mono">{order.guestToken}</span></p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-sand/10 pb-2">
              <FileText className="h-4 w-4 text-gold" strokeWidth={1.5} />
              <span className="text-[9px] uppercase font-bold tracking-widest text-charcoal">Fulfillment Channels</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-muted font-light">Origin Sales Channel:</p>
                <p className="font-semibold uppercase tracking-wider text-stone-800 mt-1">{order.source}</p>
              </div>
              <div>
                <p className="text-slate-muted font-light">Settled Currency:</p>
                <p className="font-semibold uppercase tracking-wider text-stone-800 mt-1">{order.currency}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses Snapshots */}
        {order.address && (
          <div className="bg-white border border-sand/20 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-[8px] uppercase tracking-widest font-bold text-slate-muted/50 border-b border-sand/10 pb-2 block mb-3">Recipient Address Snapshot</span>
              <p className="text-xs text-charcoal font-light leading-relaxed">
                <span className="font-bold text-stone-800">{order.address.shippingAddress.firstName} {order.address.shippingAddress.lastName}</span><br />
                {order.address.shippingAddress.addressLine1} {order.address.shippingAddress.addressLine2 && `, ${order.address.shippingAddress.addressLine2}`}<br />
                {order.address.shippingAddress.city}, {order.address.shippingAddress.state} {order.address.shippingAddress.postalCode}<br />
                {order.address.shippingAddress.country}<br />
                Phone: {order.address.shippingAddress.phone || "N/A"}<br />
                Email: {order.address.shippingAddress.email || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-widest font-bold text-slate-muted/50 border-b border-sand/10 pb-2 block mb-3">Billing Verification Snapshot</span>
              <p className="text-xs text-charcoal font-light leading-relaxed">
                <span className="font-bold text-stone-800">{order.address.billingAddress.firstName} {order.address.billingAddress.lastName}</span><br />
                {order.address.billingAddress.addressLine1} {order.address.billingAddress.addressLine2 && `, ${order.address.billingAddress.addressLine2}`}<br />
                {order.address.billingAddress.city}, {order.address.billingAddress.state} {order.address.billingAddress.postalCode}<br />
                {order.address.billingAddress.country}<br />
                Phone: {order.address.billingAddress.phone || "N/A"}<br />
                Email: {order.address.billingAddress.email || "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* Ordered Item list details */}
        <div className="bg-white border border-sand/20 shadow-sm p-6 space-y-4">
          <span className="text-[8px] uppercase tracking-widest font-bold text-slate-muted/50 border-b border-sand/10 pb-2 block">Acquired Boutique Items</span>
          <div className="space-y-4 divide-y divide-sand/10">
            {order.items.map((item) => (
              <div key={item.orderItemId || item.variantId} className="flex justify-between items-start gap-4 pt-4 first:pt-0 border-t first:border-t-0 border-sand/10 text-xs">
                <div className="min-w-0">
                  <h4 className="font-semibold text-stone-850 uppercase tracking-wide truncate">{item.productSnapshot.name}</h4>
                  <p className="text-[9px] text-slate-muted uppercase tracking-widest font-bold mt-1">
                    SKU: {item.productSnapshot.sku} | Quantity: {item.quantity} | Price: ${item.productSnapshot.price.toFixed(2)}
                  </p>
                  {item.isGift && (
                    <div className="mt-2 p-2 bg-ivory/50 border border-sand/30 border-dashed text-[10px] text-slate-muted italic">
                      Complimentary gift message: "{item.giftMessage || 'With compliments.'}"
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-charcoal">
                    ${(item.productSnapshot.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Financial values recalculation, actions bar, timelines */}
      <div className="lg:col-span-4 space-y-8">
        {/* Financial Billing recs */}
        <div className="bg-white border border-sand/20 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-sand/20 pb-4">
            <h3 className="text-xs uppercase tracking-[0.25em] font-bold text-charcoal">
              Financial Summary
            </h3>
            {!isEditingTotals ? (
              <button
                onClick={() => setIsEditingTotals(true)}
                className="text-[9px] uppercase tracking-widest font-bold text-gold hover:text-charcoal transition-colors flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Adjust
              </button>
            ) : (
              <button
                onClick={handleUpdateTotalsSubmit}
                disabled={isSubmitting}
                className="text-[9px] uppercase tracking-widest font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1"
              >
                <Save className="h-3 w-3" />
                Save
              </button>
            )}
          </div>

          {!isEditingTotals ? (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-muted font-light">Subtotal</span>
                <span className="text-charcoal font-medium">${order.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-muted font-light">Delivery Standard</span>
                <span className="text-charcoal font-medium">
                  {order.totals.shipping === 0 ? "FREE" : `$${order.totals.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-muted font-light">Estimated Sales Tax</span>
                <span className="text-charcoal font-medium">${order.totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-650">
                <span className="font-light">Concierge Discount</span>
                <span className="font-medium">-${order.totals.discount.toFixed(2)}</span>
              </div>
              <div className="h-[1px] bg-sand/20 my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-charcoal uppercase tracking-widest font-bold">Total Settled</span>
                <span className="text-stone-850 font-bold">${order.totals.total.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-muted font-light">Subtotal (Locked)</span>
                <span className="text-charcoal font-medium">${order.totals.subtotal.toFixed(2)}</span>
              </div>
              <FormField id="tax" label="Tax Amount ($)" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                <Input
                  id="tax"
                  variant="boxed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </FormField>
              <FormField id="shipping" label="Delivery Charge ($)" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                <Input
                  id="shipping"
                  variant="boxed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                />
              </FormField>
              <FormField id="discount" label="Applied Discount ($)" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                <Input
                  id="discount"
                  variant="boxed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </FormField>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setTax(String(order.totals.tax));
                    setShipping(String(order.totals.shipping));
                    setDiscount(String(order.totals.discount));
                    setIsEditingTotals(false);
                  }}
                  className="h-8 text-[9px] uppercase tracking-widest font-bold rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateTotalsSubmit}
                  className="h-8 text-[9px] uppercase tracking-widest font-bold rounded-none"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Action Panel */}
        <div className="bg-white border border-sand/20 shadow-sm p-6 space-y-6">
          <h3 className="text-xs uppercase tracking-[0.25em] font-bold text-charcoal border-b border-sand/20 pb-4">
            Workflow Actions
          </h3>

          <div className="space-y-3">
            {/* Mark Paid */}
            {canMarkPaid && (
              <Button
                variant="primary"
                onClick={() => handleAction(onMarkPaid, "Order marked as Paid successfully.")}
                className="w-full h-12 uppercase tracking-widest text-[9px] font-bold rounded-none"
                disabled={isSubmitting}
              >
                Mark Order Paid
              </Button>
            )}

            {/* Mark Fulfilled */}
            {canMarkFulfilled && (
              <Button
                variant="primary"
                onClick={() => handleAction(onMarkFulfilled, "Order marked as Fulfilled successfully.")}
                className="w-full h-12 uppercase tracking-widest text-[9px] font-bold rounded-none"
                disabled={isSubmitting}
              >
                Mark Order Fulfilled
              </Button>
            )}

            {/* Cancel Order */}
            {canCancel && (
              <Button
                variant="ghost"
                onClick={() => handleAction(onCancel, "Order cancelled successfully.")}
                className="w-full h-12 uppercase tracking-widest text-[9px] font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-none transition-all"
                disabled={isSubmitting}
              >
                Cancel Order Request
              </Button>
            )}

            {/* If terminal state */}
            {!canCancel && (
              <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 text-[10px] text-stone-500 font-light italic leading-normal">
                <ShieldAlert className="h-4 w-4 text-slate-muted flex-shrink-0" />
                This order has entered a terminal state ({order.status}) and cannot accept workflow mutations.
              </div>
            )}
          </div>

          {/* Admin Override Dropdown */}
          <div className="pt-4 border-t border-sand/10 space-y-3">
            <span className="text-[8px] uppercase tracking-widest font-bold text-slate-muted/50 block">Force Status Override</span>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAction(() => onUpdateStatus(e.target.value), `Order status overridden to ${e.target.value}.`);
                    e.target.value = "";
                  }
                }}
                className="w-full px-3 py-2 text-[10px] border border-sand/30 bg-white uppercase tracking-widest font-bold focus:outline-none focus:border-gold"
              >
                <option value="">SELECT STATUS FORCE OVERRIDE...</option>
                <option value="created">CREATED</option>
                <option value="pending">PENDING</option>
                <option value="confirmed">CONFIRMED</option>
                <option value="paid">PAID</option>
                <option value="processing">PROCESSING</option>
                <option value="shipped">SHIPPED</option>
                <option value="delivered">DELIVERED</option>
                <option value="cancelled">CANCELLED</option>
                <option value="refunded">REFUNDED</option>
                <option value="partially_returned">PARTIALLY RETURNED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline Timeline Chronology */}
        <div className="bg-white border border-sand/20 shadow-sm p-6 space-y-6">
          <div className="flex border-b border-sand/20">
            <button
              onClick={() => setActiveTimelineTab("history")}
              className={cn(
                "flex-1 pb-3 text-[9px] uppercase font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-1.5",
                activeTimelineTab === "history" ? "text-stone-850 border-b-2 border-stone-800" : "text-stone-400 border-b border-transparent"
              )}
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
            <button
              onClick={() => setActiveTimelineTab("events")}
              className={cn(
                "flex-1 pb-3 text-[9px] uppercase font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-1.5",
                activeTimelineTab === "events" ? "text-stone-850 border-b-2 border-stone-800" : "text-stone-400 border-b border-transparent"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              Audit Logs
            </button>
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-4 pr-1 text-[10px] text-charcoal">
            {activeTimelineTab === "history" ? (
              statusHistory.length === 0 ? (
                <p className="italic text-slate-muted/50 text-center font-light py-4">No status transitions logged.</p>
              ) : (
                statusHistory.map((h) => (
                  <div key={h.id} className="relative pl-6 border-l border-sand/35 space-y-1 py-1">
                    {/* Stepper Dot */}
                    <div className="absolute left-0 top-1.5 -translate-x-[4.5px] h-2 w-2 rounded-full bg-gold" />
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-bold uppercase tracking-wider text-[8px] text-stone-400">
                        {h.fromStatus || "START"}
                      </span>
                      <ChevronRight className="h-2 w-2 text-stone-300" />
                      <span className="font-bold uppercase tracking-wider text-[9px] text-gold">
                        {h.toStatus}
                      </span>
                    </div>
                    <p className="font-light text-slate-muted">
                      Changed by <strong className="font-medium text-stone-700">{h.changedBy || "system"}</strong> at {new Date(h.changedAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )
            ) : (
              events.length === 0 ? (
                <p className="italic text-slate-muted/50 text-center font-light py-4">No audit events recorded.</p>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="relative pl-6 border-l border-sand/35 space-y-1 py-1">
                    {/* Stepper Dot */}
                    <div className="absolute left-0 top-1.5 -translate-x-[4px] h-1.5 w-1.5 rounded-full bg-slate-muted/50" />
                    <h5 className="font-bold uppercase tracking-wider text-[9px] text-stone-750">
                      {e.eventType}
                    </h5>
                    <p className="text-[9px] text-slate-muted font-light font-mono leading-normal break-all">
                      {JSON.stringify(e.payload)}
                    </p>
                    <span className="text-[8px] text-slate-muted/60 block">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

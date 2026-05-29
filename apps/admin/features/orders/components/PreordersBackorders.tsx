"use client";

import React, { useState } from "react";
import { Clock, RefreshCw, Send, Calendar } from "lucide-react";
import { Button, Input, FormField, cn } from "@tasheen/ui";
import { toast } from "sonner";
import Link from "next/link";

interface PreorderBackorderItem {
  orderItemId: string;
  promisedEta?: string;
  releaseDate?: string;
  notifiedAt?: string;
  orderItem?: {
    qty: number;
    productSnapshot: {
      name: string;
      sku: string;
      price: number;
    };
    order: {
      orderNo: string;
      id: string;
    };
  };
}

interface PreordersBackordersProps {
  preorders: PreorderBackorderItem[];
  backorders: PreorderBackorderItem[];
  isLoadingPreorders: boolean;
  isLoadingBackorders: boolean;
  onRefresh: () => void;
  onUpdatePreorderDate: (orderItemId: string, date: Date) => Promise<any>;
  onUpdateBackorderEta: (orderItemId: string, date: Date) => Promise<any>;
  onNotifyPreorder: (orderItemId: string) => Promise<any>;
  onNotifyBackorder: (orderItemId: string) => Promise<any>;
}

export function PreordersBackorders({
  preorders,
  backorders,
  isLoadingPreorders,
  isLoadingBackorders,
  onRefresh,
  onUpdatePreorderDate,
  onUpdateBackorderEta,
  onNotifyPreorder,
  onNotifyBackorder,
}: PreordersBackordersProps) {
  const [activeTab, setActiveTab] = useState<"preorders" | "backorders">("preorders");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateDate = async (orderItemId: string) => {
    if (!newDate) return;
    setIsSubmitting(true);
    try {
      const selectedDate = new Date(newDate);
      if (activeTab === "preorders") {
        await onUpdatePreorderDate(orderItemId, selectedDate);
        toast.success("Preorder release date updated successfully.");
      } else {
        await onUpdateBackorderEta(orderItemId, selectedDate);
        toast.success("Backorder promised ETA updated successfully.");
      }
      setEditingItemId(null);
      setNewDate("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update date.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotify = async (orderItemId: string) => {
    setIsSubmitting(true);
    try {
      if (activeTab === "preorders") {
        await onNotifyPreorder(orderItemId);
        toast.success("Preorder customer notified. Arrival email dispatched.");
      } else {
        await onNotifyBackorder(orderItemId);
        toast.success("Backorder customer notified. Allocation email dispatched.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to dispatch notification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = activeTab === "preorders" ? preorders : backorders;
  const isLoading = activeTab === "preorders" ? isLoadingPreorders : isLoadingBackorders;

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-sand/20 justify-between items-center bg-ivory p-4 border border-sand/20 shadow-sm">
        <div className="flex gap-6">
          <button
            onClick={() => {
              setActiveTab("preorders");
              setEditingItemId(null);
            }}
            className={cn(
              "pb-2 text-[10px] uppercase font-bold tracking-[0.2em] transition-all relative",
              activeTab === "preorders" ? "text-stone-850 border-b-2 border-stone-800" : "text-stone-400 border-b border-transparent"
            )}
          >
            Preorders Registry
          </button>
          <button
            onClick={() => {
              setActiveTab("backorders");
              setEditingItemId(null);
            }}
            className={cn(
              "pb-2 text-[10px] uppercase font-bold tracking-[0.2em] transition-all relative",
              activeTab === "backorders" ? "text-stone-850 border-b-2 border-stone-800" : "text-stone-400 border-b border-transparent"
            )}
          >
            Backorders Queue
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center justify-center p-2 bg-white border border-sand/30 text-slate-muted hover:text-gold hover:border-gold transition-colors"
          title="Refresh allocations lists"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Registry Table */}
      <div className="bg-white border border-sand/20 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-sand/20 bg-ivory/50">
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60">Bespoke Creation</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60">Order Reference</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-center">Qty</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-right">Unit Price</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60">
                {activeTab === "preorders" ? "Release Date" : "Promised ETA"}
              </th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-center">Notification Status</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-muted/60 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/10">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="h-6 w-6 text-gold animate-spin" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-muted/50">Recalling Registry...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-xs text-slate-muted/50 font-light">
                  No matching allocated items found in the current buffer.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.orderItemId} className="hover:bg-ivory/20 transition-colors duration-250">
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-charcoal">{item.orderItem?.productSnapshot.name || "Footwear Creation"}</div>
                    <span className="text-[9px] font-mono text-slate-muted block mt-0.5">SKU: {item.orderItem?.productSnapshot.sku || "N/A"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/orders/${item.orderItem?.order.id}`}
                      className="text-xs font-mono font-bold text-gold hover:text-charcoal transition-colors block"
                    >
                      {item.orderItem?.order.orderNo || "ORD-N/A"}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-charcoal font-medium">
                    {item.orderItem?.qty || 0}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-charcoal font-medium">
                    ${item.orderItem?.productSnapshot.price.toFixed(2) || "0.00"}
                  </td>
                  <td className="px-6 py-4">
                    {editingItemId === item.orderItemId ? (
                      <div className="flex items-center gap-2 animate-fadeIn">
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="px-2 py-1 text-xs border border-sand/30 focus:outline-none focus:border-gold"
                        />
                        <button
                          onClick={() => handleUpdateDate(item.orderItemId)}
                          className="text-[9px] uppercase font-bold text-emerald-700 hover:text-emerald-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingItemId(null)}
                          className="text-[9px] uppercase font-bold text-stone-400 hover:text-stone-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-charcoal">
                          {activeTab === "preorders"
                            ? item.releaseDate
                              ? new Date(item.releaseDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                              : "Unscheduled"
                            : item.promisedEta
                            ? new Date(item.promisedEta).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                            : "TBD"}
                        </span>
                        <button
                          onClick={() => {
                            setNewDate(
                              activeTab === "preorders"
                                ? item.releaseDate ? new Date(item.releaseDate).toISOString().split("T")[0]! : ""
                                : item.promisedEta ? new Date(item.promisedEta).toISOString().split("T")[0]! : ""
                            );
                            setEditingItemId(item.orderItemId);
                          }}
                          className="text-stone-300 hover:text-gold transition-colors"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 border inline-block",
                      item.notifiedAt
                        ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                        : "bg-amber-50 text-amber-700 border-amber-250"
                    )}>
                      {item.notifiedAt
                        ? `Notified (${new Date(item.notifiedAt).toLocaleDateString()})`
                        : "Awaiting Stock"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleNotify(item.orderItemId)}
                      className="h-8 text-[9px] uppercase tracking-widest font-bold rounded-none flex items-center gap-1 inline-flex"
                      disabled={isSubmitting}
                    >
                      <Send className="h-2.5 w-2.5" />
                      Notify User
                    </Button>
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

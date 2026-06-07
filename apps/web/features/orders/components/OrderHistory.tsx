"use client";

import { useState } from "react";
import { useUserOrders, useCancelOrder } from "../hooks/useOrders";
import { Button, cn } from "@tasheen/ui";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import type { Order } from "../types";

const DetailField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1 w-full">
    <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-stone-400 flex items-end h-8 pb-1">
      {label}
    </div>
    <div className="w-full bg-[#FAF8F5] border border-[#F2EDE2]/60 rounded-lg px-4 py-2.5 text-xs sm:text-[13px] text-stone-850 font-medium flex items-center min-h-[38px] leading-normal shadow-sm">
      {value}
    </div>
  </div>
);

export function OrderHistory() {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"ledger" | "selections" | "journey">("ledger");


  const { data: result, isLoading, error, refetch } = useUserOrders();
  const cancelMutation = useCancelOrder(selectedOrder?.id || "");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-stone-800 border-r-2" />
        <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Loading Order History...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-6 bg-stone-50 border border-stone-150 text-center text-xs text-stone-500 font-light">
        Unable to retrieve order history at this time.
      </div>
    );
  }

  const orders = result.items;

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    const status = o.status.toLowerCase();
    if (filter === "all") return true;
    if (filter === "completed") return status === "delivered" || status === "fulfilled" || status === "partially_returned";
    if (filter === "cancelled") return status === "cancelled" || status === "refunded";
    // Active orders are anything not completed or cancelled
    return status !== "delivered" && status !== "fulfilled" && status !== "partially_returned" && status !== "cancelled" && status !== "refunded";
  });

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "created") return "bg-blue-50 text-blue-700 border border-blue-100";
    if (s === "pending") return "bg-amber-50 text-amber-700 border border-amber-100";
    if (s === "paid" || s === "confirmed") return "bg-green-50 text-green-700 border border-green-100";
    if (s === "processing") return "bg-indigo-50 text-indigo-700 border border-indigo-100";
    if (s === "shipped") return "bg-purple-50 text-purple-700 border border-purple-100";
    if (s === "delivered" || s === "fulfilled") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (s === "cancelled" || s === "refunded") return "bg-red-50 text-red-700 border border-red-100";
    if (s === "partially_returned") return "bg-orange-50 text-orange-700 border border-orange-100";
    return "bg-stone-100 text-stone-600 border border-stone-200";
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      const updatedOrder = await cancelMutation.mutateAsync();
      toast.success("Order has been cancelled successfully.");
      setSelectedOrder(updatedOrder);
      setIsCancelConfirmOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to cancel order.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Filters */}
      <div className="flex border-b border-stone-200 gap-6">
        {(["all", "active", "completed", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "pb-3 text-[10px] uppercase font-bold tracking-[0.2em] transition-all relative",
              filter === tab ? "text-stone-850 border-b-2 border-stone-800" : "text-stone-400 border-b border-transparent"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-stone-50 border border-stone-100 p-6">
          <p className="text-xs text-stone-500 font-light leading-relaxed">
            No order records match your active filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 bg-stone-50 border border-stone-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-stone-300 transition-all duration-300"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-stone-800">{order.orderNumber}</span>
                  <span className={cn("text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-none", getStatusStyle(order.status))}>
                    {order.status}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-light">
                  Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} | {order.items.reduce((sum, i) => sum + i.quantity, 0)} Items
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-stone-200">
                <span className="text-xs font-bold text-stone-850">${order.totals.total.toFixed(2)}</span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedOrder(order);
                    setModalTab("ledger");
                  }}
                  className="h-10 text-[9px] uppercase tracking-wider font-bold rounded-none"
                >
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setIsCancelConfirmOpen(false);
        }}
        title="Commission Order Details"
        className="rounded-[24px] overflow-hidden"
      >
        {selectedOrder && (
          <div className="space-y-5 pb-4">
            {isCancelConfirmOpen ? (
              /* Cancellation workflow inside the card container */
              <div className="w-full text-center space-y-4 py-4">
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-red-600 block">
                  Security Reversal Confirmation
                </span>
                <h4 className="font-serif text-2xl text-stone-850 tracking-tight italic">
                  Are you absolutely sure you want to cancel?
                </h4>
                <p className="text-xs text-stone-500 font-light max-w-md mx-auto leading-relaxed">
                  Cancelling this order will release all your reserved handcrafted items back into our inventory instantly. This request is irreversible.
                </p>
                <div className="flex justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCancelConfirmOpen(false)}
                    className="rounded-full border border-stone-300 px-5 py-2 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-600 transition-all shadow-sm"
                  >
                    Abort Request
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelMutation.isPending}
                    className="rounded-full bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                  >
                    {cancelMutation.isPending ? "Processing..." : "Confirm Cancellation"}
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Tabbed Slipperze Layout */
              <div className="space-y-5">
                {/* Elegant Slipperze-themed Minimal Tabs */}
                <div className="flex border-b border-stone-100 gap-6 pb-0.5">
                  {([
                    { id: "ledger", label: "Ledger" },
                    { id: "selections", label: "Selections" },
                    { id: "journey", label: "Journey" },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setModalTab(tab.id)}
                      className={cn(
                        "pb-2.5 text-[10px] uppercase font-bold tracking-[0.25em] transition-all relative whitespace-nowrap",
                        modalTab === tab.id
                          ? "text-burgundy font-bold"
                          : "text-stone-400 hover:text-charcoal"
                      )}
                    >
                      {tab.label}
                      {modalTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-burgundy rounded-full animate-fadeIn" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                {modalTab === "ledger" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column: Order Identity */}
                      <div className="space-y-3">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C2D19] block border-b border-stone-100/60 pb-1">
                          Identity & Contact
                        </span>
                        <DetailField label="Reference" value={selectedOrder.orderNumber} />
                        <DetailField
                          label="Placed On"
                          value={new Date(selectedOrder.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        />
                        <DetailField
                          label="Status"
                          value={
                            <span className={cn("text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm", getStatusStyle(selectedOrder.status))}>
                              {selectedOrder.status}
                            </span>
                          }
                        />
                        <DetailField
                          label="Contact"
                          value={<span className="truncate block text-xs sm:text-[13px]">{selectedOrder.address?.shippingAddress.email || selectedOrder.address?.shippingAddress.phone || "N/A"}</span>}
                        />
                      </div>

                      {/* Right Column: Target Destination */}
                      <div className="space-y-3">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C2D19] block border-b border-stone-100/60 pb-1">
                          Recipient & Address
                        </span>
                        <DetailField
                          label="Recipient"
                          value={`${selectedOrder.address?.shippingAddress.firstName} ${selectedOrder.address?.shippingAddress.lastName}`}
                        />
                        <DetailField
                          label="Carrier"
                          value={<span className="uppercase font-semibold text-[10px] tracking-wider">{selectedOrder.shipments?.[0]?.carrier || "Awaiting Carrier"}</span>}
                        />
                        <DetailField
                          label="Delivery Destination"
                          value={
                            <span className="leading-relaxed block text-xs sm:text-[13px]">
                              {selectedOrder.address?.shippingAddress.addressLine1}, {selectedOrder.address?.shippingAddress.city}, {selectedOrder.address?.shippingAddress.state} {selectedOrder.address?.shippingAddress.postalCode}
                            </span>
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === "selections" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="space-y-3">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C2D19] block border-b border-stone-100/60 pb-1">
                        Bespoke Selections
                      </span>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 ts-scrollbar-bold">
                        {selectedOrder.items.map((item) => (
                          <div
                            key={item.orderItemId || item.variantId}
                            className="border border-[#F2EDE2]/60 rounded-xl p-3.5 bg-[#FAF8F5] flex justify-between items-center hover:bg-stone-50 transition-all duration-150 shadow-sm"
                          >
                            <div className="min-w-0 space-y-1">
                              <h5 className="font-semibold text-stone-850 uppercase tracking-wide text-xs sm:text-[13px] truncate">
                                {item.productSnapshot.name}
                              </h5>
                              <p className="text-[8px] text-stone-400 uppercase tracking-widest font-bold">
                                SKU: {item.productSnapshot.sku}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0 space-y-0.5">
                              <span className="text-[10px] text-stone-400 block font-light">
                                {item.quantity} x ${item.productSnapshot.price.toFixed(2)}
                              </span>
                              <span className="font-bold text-stone-850 text-xs sm:text-[13px]">
                                ${(item.productSnapshot.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-3 border-t border-[#F2EDE2]/60">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C2D19] block border-b border-stone-100/60 pb-1 mb-3">
                        Financial Summary
                      </span>
                      <div className={cn(
                        "grid gap-3",
                        selectedOrder.totals.discount > 0
                          ? "grid-cols-2 sm:grid-cols-5"
                          : "grid-cols-2 sm:grid-cols-4"
                      )}>
                        <DetailField label="Subtotal" value={`$${selectedOrder.totals.subtotal.toFixed(2)}`} />
                        <DetailField
                          label="Delivery"
                          value={selectedOrder.totals.shipping === 0 ? "FREE" : `$${selectedOrder.totals.shipping.toFixed(2)}`}
                        />
                        <DetailField label="Tax" value={`$${selectedOrder.totals.tax.toFixed(2)}`} />
                        {selectedOrder.totals.discount > 0 && (
                          <div className="space-y-1 w-full animate-fadeIn">
                            <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-red-500 flex items-end h-8 pb-1">
                              Promotion Applied
                            </div>
                            <div className="w-full bg-[#FAF8F5] border border-red-100/60 rounded-lg px-4 py-2.5 text-xs sm:text-[13px] text-red-600 font-bold flex items-center min-h-[38px] leading-normal shadow-sm">
                              -${selectedOrder.totals.discount.toFixed(2)}
                            </div>
                          </div>
                        )}
                        <div className="space-y-1 w-full">
                          <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-stone-400 flex items-end h-8 pb-1">
                            Acquisition Total
                          </div>
                          <div className="w-full bg-[#FAF8F5] border border-[#8C2D19]/25 rounded-lg px-4 py-2.5 text-xs sm:text-[13px] text-[#8C2D19] font-bold flex items-center min-h-[38px] shadow-sm leading-normal">
                            ${selectedOrder.totals.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === "journey" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="space-y-4">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C2D19] block border-b border-stone-100/60 pb-1">
                        Fulfillment Journey State
                      </span>

                      {/* Spacious tracking card */}
                      <DetailField
                        label="Delivery Tracking"
                        value={
                          selectedOrder.shipments?.[0]?.trackingNo ? (
                            <span className="font-mono text-xs sm:text-[13px] text-stone-850">
                              {selectedOrder.shipments[0].trackingNo}
                            </span>
                          ) : (
                            <span className="text-stone-400 text-xs sm:text-[13px] italic">
                              Awaiting dispatch records...
                            </span>
                          )
                        }
                      />

                      {/* Premium tracking timeline */}
                      <div className="bg-[#FAF8F5] border border-[#F2EDE2]/60 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
                        <div className="grid grid-cols-5 gap-2 relative z-10">
                          {/* Horizontal connecting background line */}
                          <div className="absolute top-[11px] left-[10%] right-[10%] h-[3px] bg-stone-150 -z-10 rounded-full" />
                          
                          {/* Horizontal connecting active line */}
                          <div 
                            className="absolute top-[11px] left-[10%] h-[3px] bg-[#8C2D19] -z-10 rounded-full transition-all duration-500"
                            style={{
                              width: (() => {
                                const s = selectedOrder.status.toLowerCase();
                                if (s === "paid" || s === "confirmed") return "25%";
                                else if (s === "processing") return "50%";
                                else if (s === "shipped") return "75%";
                                else if (s === "delivered" || s === "fulfilled") return "100%";
                                return "0%";
                              })()
                            }}
                          />

                          {["created", "paid", "processing", "shipped", "delivered"].map((step, idx) => {
                            const s = selectedOrder.status.toLowerCase();
                            let activeIdx = 0;
                            if (s === "paid" || s === "confirmed") activeIdx = 1;
                            else if (s === "processing") activeIdx = 2;
                            else if (s === "shipped") activeIdx = 3;
                            else if (s === "delivered" || s === "fulfilled") activeIdx = 4;

                            const isDone = idx <= activeIdx;
                            return (
                              <div key={step} className="flex flex-col items-center space-y-2">
                                <div
                                  className={cn(
                                    "h-[24px] w-[24px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-500 shadow-sm",
                                    isDone
                                      ? "bg-[#8C2D19] border-[#8C2D19] text-white"
                                      : "bg-white border-stone-200 text-stone-400"
                                  )}
                                >
                                  {idx + 1}
                                </div>
                                <span
                                  className={cn(
                                    "text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-center block w-full truncate",
                                    isDone ? "text-stone-850 font-bold" : "text-stone-350"
                                  )}
                                >
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Secure Audit Footer inside card */}
            <div className="flex justify-between items-center border-t border-[#F2EDE2]/60 pt-4 mt-4 mb-2">
              <div className="flex items-center gap-1.5 text-stone-400 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold">
                <span className="text-[#8C2D19]">●</span> Secure Ledger Registered
              </div>
              {selectedOrder.status.toLowerCase() === "created" && !isCancelConfirmOpen && (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="rounded-full bg-stone-900 hover:bg-stone-850 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

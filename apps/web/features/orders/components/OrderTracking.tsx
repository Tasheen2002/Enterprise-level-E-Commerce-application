"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTrackOrder } from "../hooks/useOrders";
import { Button, Input, FormField, cn } from "@tasheen/ui";

export function OrderTracking() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"order" | "tracking">("order");
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [triggerQuery, setTriggerQuery] = useState(false);

  // Initialize from search query params if provided
  useEffect(() => {
    const queryOrderNumber = searchParams.get("orderNumber");
    const queryContact = searchParams.get("contact");
    const queryTrackingNumber = searchParams.get("trackingNumber");

    if (queryOrderNumber && queryContact) {
      setOrderNumber(queryOrderNumber);
      setContact(queryContact);
      setTab("order");
      setTriggerQuery(true);
    } else if (queryTrackingNumber) {
      setTrackingNumber(queryTrackingNumber);
      setTab("tracking");
      setTriggerQuery(true);
    }
  }, [searchParams]);

  const { data: result, isLoading, error, refetch } = useTrackOrder(
    {
      orderNumber: tab === "order" ? orderNumber : undefined,
      contact: tab === "order" ? contact : undefined,
      trackingNumber: tab === "tracking" ? trackingNumber : undefined,
    },
    triggerQuery
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "order" && (!orderNumber || !contact)) return;
    if (tab === "tracking" && !trackingNumber) return;
    setTriggerQuery(true);
    refetch();
  };

  // Determine active status states for visual progress stepper
  const getStatusSteps = (status: string) => {
    const normalized = status.toLowerCase();
    const steps = [
      { id: "created", label: "Registered", desc: "Order details received" },
      { id: "paid", label: "Payment Verified", desc: "Funds confirmed" },
      { id: "processing", label: "Processing", desc: "Awaiting packaging" },
      { id: "shipped", label: "Dispatched", desc: "Handed to carrier" },
      { id: "delivered", label: "Delivered", desc: "Received at destination" },
    ];

    let activeIdx = 0;
    if (normalized === "paid" || normalized === "confirmed") activeIdx = 1;
    else if (normalized === "processing") activeIdx = 2;
    else if (normalized === "shipped") activeIdx = 3;
    else if (normalized === "delivered" || normalized === "fulfilled") activeIdx = 4;

    return steps.map((step, idx) => ({
      ...step,
      isCompleted: idx < activeIdx,
      isActive: idx === activeIdx,
    }));
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-12">
      {/* Lookup Form */}
      <div className="p-6 sm:p-8 bg-stone-50 border border-stone-150 rounded-none shadow-sm space-y-6">
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => {
              setTab("order");
              setTriggerQuery(false);
            }}
            className={cn(
              "flex-1 pb-3 text-[10px] uppercase font-bold tracking-[0.2em] transition-all",
              tab === "order" ? "text-stone-850 border-b-2 border-stone-800" : "text-stone-400 border-b border-transparent"
            )}
          >
            Order Details
          </button>
          <button
            onClick={() => {
              setTab("tracking");
              setTriggerQuery(false);
            }}
            className={cn(
              "flex-1 pb-3 text-[10px] uppercase font-bold tracking-[0.2em] transition-all",
              tab === "tracking" ? "text-stone-850 border-b-2 border-stone-800" : "text-stone-400 border-b border-transparent"
            )}
          >
            Tracking Number
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {tab === "order" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField id="orderNumber" label="Order ID" className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="orderNumber"
                  variant="boxed"
                  placeholder="e.g. ORD-XXXXXX"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                />
              </FormField>
              <FormField id="contact" label="Contact Email / Phone" className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
                <Input
                  id="contact"
                  variant="boxed"
                  placeholder="e.g. eleanor@vance.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </FormField>
            </div>
          ) : (
            <FormField id="trackingNumber" label="Carrier Tracking Code" className="uppercase tracking-[0.15em] text-[9px] font-bold text-stone-400">
              <Input
                id="trackingNumber"
                variant="boxed"
                placeholder="e.g. USPS-12345..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
              />
            </FormField>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="h-14 uppercase tracking-[0.2em] text-[10px] font-bold rounded-none"
            disabled={isLoading}
            isLoading={isLoading}
          >
            Locate Creation State
          </Button>
        </form>
      </div>

      {/* Error state */}
      {triggerQuery && error && (
        <div className="p-6 bg-red-50/50 border border-red-100 text-center space-y-2">
          <p className="text-xs text-red-600 font-medium">Unable to resolve matching order record.</p>
          <p className="text-[10px] text-stone-400 font-light">
            Double check that you typed the order credentials correctly, or consult support.
          </p>
        </div>
      )}

      {/* Lookup results */}
      {triggerQuery && result && !isLoading && !error && (
        <div className="space-y-12 animate-fadeIn">
          {/* visual stepper progress timeline */}
          <div className="space-y-6">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.25em] text-stone-850 block mb-6">
              Fulfillment Journey
            </h3>

            {/* Stepper timeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {getStatusSteps(result.status).map((step, idx) => (
                <div key={step.id} className="relative flex flex-row md:flex-col items-start gap-4 md:gap-0">
                  {/* Step bubble */}
                  <div className="flex items-center md:mb-3">
                    <div className={cn(
                      "h-8 w-8 rounded-none border flex items-center justify-center text-[10px] font-bold tracking-widest transition-all duration-500",
                      step.isActive ? "bg-stone-850 text-white border-stone-850 shadow-sm" : "",
                      step.isCompleted ? "bg-stone-200 text-stone-700 border-stone-250" : "",
                      !step.isActive && !step.isCompleted ? "bg-transparent text-stone-300 border-stone-200" : ""
                    )}>
                      {step.isCompleted ? "✓" : `0${idx + 1}`}
                    </div>
                    {/* Horizontal link bar (desktop) */}
                    {idx < 4 && (
                      <div className={cn(
                        "hidden md:block h-[1px] w-[120px] ml-2",
                        step.isCompleted ? "bg-stone-300" : "bg-stone-200"
                      )} />
                    )}
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-[10px] uppercase font-bold tracking-wider",
                      step.isActive ? "text-stone-855" : "text-stone-500"
                    )}>
                      {step.label}
                    </h4>
                    <p className="text-[9px] text-stone-400 font-light mt-0.5 leading-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipment specifications (if active) */}
          {result.shipments && result.shipments.length > 0 && (
            <div className="p-6 bg-stone-50 border border-stone-150 space-y-4">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.25em] text-stone-850 border-b border-stone-200 pb-3">
                Shipping Carrier Dispatch Details
              </h3>
              {result.shipments.map((s) => (
                <div key={s.id} className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Carrier Provider</span>
                    <p className="text-stone-800 font-medium mt-1 uppercase tracking-wider">{s.carrier || "Standard Courier"}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Service Class</span>
                    <p className="text-stone-800 font-medium mt-1 uppercase tracking-wider">{s.service || "Standard Delivery"}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Tracking Code</span>
                    <p className="text-stone-850 font-mono font-bold mt-1 tracking-wider">{s.trackingNo || "Pending Shipment"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Creation contents list */}
          <div className="p-6 bg-stone-50 border border-stone-150 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-4">
              <div>
                <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Invoice ID</span>
                <h4 className="text-sm font-mono font-bold text-stone-800 mt-1">{result.orderNumber}</h4>
              </div>
              <div className="text-right">
                <span className="text-[8px] uppercase tracking-widest font-bold text-stone-400">Registered Date</span>
                <p className="text-xs text-stone-600 font-light mt-1">
                  {new Date(result.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* items */}
            <div className="space-y-4">
              {result.items.map((item) => (
                <div key={item.orderItemId || item.variantId} className="flex justify-between items-center gap-4 text-xs">
                  <div className="min-w-0">
                    <h5 className="font-medium text-stone-850 uppercase tracking-wide truncate">
                      {item.productSnapshot.name}
                    </h5>
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mt-0.5">
                      SKU: {item.productSnapshot.sku} | Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-medium text-stone-800">
                      ${(item.productSnapshot.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* financial sum */}
            <div className="border-t border-stone-200 pt-4 flex flex-col items-end space-y-1 text-xs">
              <div className="w-full sm:w-60 space-y-1">
                <div className="flex justify-between text-stone-500 font-light">
                  <span>Subtotal</span>
                  <span>${result.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500 font-light">
                  <span>Delivery</span>
                  <span>{result.totals.shipping === 0 ? "FREE" : `$${result.totals.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-stone-500 font-light">
                  <span>Estimated Tax</span>
                  <span>${result.totals.tax.toFixed(2)}</span>
                </div>
                <div className="h-[1px] bg-stone-200 my-2" />
                <div className="flex justify-between font-bold text-stone-850">
                  <span className="uppercase tracking-wider">Acquisition Total</span>
                  <span>${result.totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

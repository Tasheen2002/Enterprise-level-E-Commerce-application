"use client";

import React, { useState } from "react";
import { Truck, CheckCircle, Plus, Edit2, Calendar } from "lucide-react";
import { Button, Input, FormField, cn } from "@tasheen/ui";
import { toast } from "sonner";

interface OrderShipment {
  id: string;
  carrier?: string;
  service?: string;
  trackingNo?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface ShipmentPanelProps {
  orderId: string;
  shipments: OrderShipment[];
  orderStatus: string;
  onCreateShipment: (body: { carrier?: string; service?: string; trackingNumber?: string }) => Promise<any>;
  onMarkShipped: (shipmentId: string, body: { carrier: string; service: string; trackingNumber: string }) => Promise<any>;
  onMarkDelivered: (shipmentId: string, body?: { deliveredAt?: Date }) => Promise<any>;
  onUpdateTracking: (shipmentId: string, body: { trackingNumber: string; carrier?: string; service?: string }) => Promise<any>;
}

export function ShipmentPanel({
  orderId,
  shipments,
  orderStatus,
  onCreateShipment,
  onMarkShipped,
  onMarkDelivered,
  onUpdateTracking,
}: ShipmentPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isShipOpen, setIsShipOpen] = useState<string | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState<string | null>(null);

  // Form states
  const [carrier, setCarrier] = useState("DHL");
  const [service, setService] = useState("Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateShipment = async () => {
    setIsSubmitting(true);
    try {
      await onCreateShipment({
        carrier: "DHL",
        service: "Express",
        trackingNumber: "PENDING_DISPATCH",
      });
      toast.success("Shipment package created successfully.");
      setIsCreateOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkShipped = async (shipmentId: string) => {
    if (!trackingNumber) {
      toast.error("Please provide a tracking number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onMarkShipped(shipmentId, {
        carrier,
        service,
        trackingNumber,
      });
      toast.success("Shipment marked as shipped. Carrier notified.");
      setIsShipOpen(null);
      setTrackingNumber("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to mark as shipped.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDelivered = async (shipmentId: string) => {
    setIsSubmitting(true);
    try {
      await onMarkDelivered(shipmentId, { deliveredAt: new Date() });
      toast.success("Package marked as delivered at destination.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to mark as delivered.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTracking = async (shipmentId: string) => {
    if (!trackingNumber) {
      toast.error("Please provide a tracking number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdateTracking(shipmentId, {
        trackingNumber,
        carrier,
        service,
      });
      toast.success("Tracking code corrected successfully.");
      setIsUpdateOpen(null);
      setTrackingNumber("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update tracking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreateShipment =
    orderStatus.toLowerCase() === "paid" ||
    orderStatus.toLowerCase() === "processing" ||
    orderStatus.toLowerCase() === "fulfilled";

  return (
    <div className="bg-white border border-sand/20 shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-sand/20 pb-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-xs uppercase font-bold tracking-[0.25em] text-charcoal">
            Shipping & Dispatch Panel
          </h3>
        </div>
        {shipments.length === 0 && canCreateShipment && (
          <Button
            variant="ghost"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 text-[9px] uppercase tracking-widest font-bold rounded-none flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Prepare Shipment Package
          </Button>
        )}
      </div>

      {/* Shipments List */}
      {shipments.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-muted/50 font-light bg-ivory/30 border border-dashed border-sand/30">
          No dispatch shipments have been created yet. Complete payment verification before packaging.
        </div>
      ) : (
        <div className="space-y-6">
          {shipments.map((s, idx) => {
            const isShipped = !!s.shippedAt;
            const isDelivered = !!s.deliveredAt;

            return (
              <div
                key={s.id}
                className="p-5 border border-sand/20 bg-ivory/10 hover:border-sand/40 transition-colors space-y-4"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-sand/10 pb-3">
                  <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-muted/60">
                    Package Shipment #{idx + 1}
                  </span>
                  <span className={cn(
                    "text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 border inline-block",
                    isDelivered
                      ? "bg-green-50 text-green-700 border-green-200"
                      : isShipped
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {isDelivered ? "Delivered" : isShipped ? "Shipped" : "Staged / Created"}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-charcoal">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-slate-muted/50">Carrier Provider</span>
                    <p className="font-semibold uppercase tracking-wider mt-1">{s.carrier || "DHL"}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-slate-muted/50">Service Class</span>
                    <p className="font-semibold uppercase tracking-wider mt-1">{s.service || "Express"}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-slate-muted/50">Tracking Code</span>
                    <p className="font-mono font-bold mt-1 tracking-wider break-words">{s.trackingNo || "Pending Assign"}</p>
                  </div>
                </div>

                {/* Timestamps */}
                {(isShipped || isDelivered) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] bg-white border border-sand/10 p-3 text-slate-muted">
                    {isShipped && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Shipped At: {new Date(s.shippedAt!).toLocaleString()}</span>
                      </div>
                    )}
                    {isDelivered && (
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Delivered At: {new Date(s.deliveredAt!).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Workflow Actions */}
                <div className="flex flex-wrap gap-3 pt-3 border-t border-sand/10 justify-end">
                  {!isShipped && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setCarrier(s.carrier || "DHL");
                        setService(s.service || "Express");
                        setTrackingNumber("");
                        setIsShipOpen(s.id);
                      }}
                      className="h-9 px-4 text-[9px] uppercase tracking-widest font-bold rounded-none"
                    >
                      Dispatch Creation (Mark Shipped)
                    </Button>
                  )}
                  {isShipped && !isDelivered && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setCarrier(s.carrier || "DHL");
                          setService(s.service || "Express");
                          setTrackingNumber(s.trackingNo || "");
                          setIsUpdateOpen(s.id);
                        }}
                        className="h-9 px-3 text-[9px] uppercase tracking-widest font-bold rounded-none flex items-center gap-1.5"
                      >
                        <Edit2 className="h-3 w-3" />
                        Correct Tracking
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleMarkDelivered(s.id)}
                        className="h-9 px-4 text-[9px] uppercase tracking-widest font-bold rounded-none"
                      >
                        Mark Delivered
                      </Button>
                    </>
                  )}
                </div>

                {/* Step Modal: Mark Shipped */}
                {isShipOpen === s.id && (
                  <div className="p-4 bg-white border border-sand/35 space-y-4 shadow-inner mt-4 animate-fadeIn">
                    <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-charcoal border-b border-sand/10 pb-2">
                      Carrier Dispatch Credentials
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField id="carrier" label="Carrier Name" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                        <Input
                          id="carrier"
                          variant="boxed"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                        />
                      </FormField>
                      <FormField id="service" label="Service Tier" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                        <Input
                          id="service"
                          variant="boxed"
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                        />
                      </FormField>
                    </div>
                    <FormField id="tracking" label="Tracking Number" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                      <Input
                        id="tracking"
                        variant="boxed"
                        placeholder="e.g. USPS-9400111..."
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        required
                      />
                    </FormField>
                    <div className="flex gap-3 justify-end pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => setIsShipOpen(null)}
                        className="h-9 text-[9px] uppercase tracking-widest font-bold rounded-none"
                      >
                        Abort
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleMarkShipped(s.id)}
                        className="h-9 text-[9px] uppercase tracking-widest font-bold rounded-none"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                      >
                        Verify & Ship Package
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step Modal: Correct Tracking */}
                {isUpdateOpen === s.id && (
                  <div className="p-4 bg-white border border-sand/35 space-y-4 shadow-inner mt-4 animate-fadeIn">
                    <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-charcoal border-b border-sand/10 pb-2">
                      Correct Dispatch Tracking
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField id="editCarrier" label="Carrier Name" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                        <Input
                          id="editCarrier"
                          variant="boxed"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                        />
                      </FormField>
                      <FormField id="editService" label="Service Tier" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                        <Input
                          id="editService"
                          variant="boxed"
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                        />
                      </FormField>
                    </div>
                    <FormField id="editTracking" label="Tracking Number" className="uppercase tracking-[0.15em] text-[8px] font-bold text-slate-muted/50">
                      <Input
                        id="editTracking"
                        variant="boxed"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        required
                      />
                    </FormField>
                    <div className="flex gap-3 justify-end pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => setIsUpdateOpen(null)}
                        className="h-9 text-[9px] uppercase tracking-widest font-bold rounded-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateTracking(s.id)}
                        className="h-9 text-[9px] uppercase tracking-widest font-bold rounded-none"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                      >
                        Save Corrections
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Prepare Shipment Modal */}
      {isCreateOpen && (
        <div className="p-5 border border-sand/35 bg-ivory/20 space-y-4 animate-fadeIn">
          <h4 className="text-[10px] uppercase font-bold tracking-[0.25em] text-charcoal border-b border-sand/20 pb-2">
            Confirm Staging Package Packaging
          </h4>
          <p className="text-xs font-light text-slate-muted leading-relaxed">
            This will prepare and log a new Slipperze wooden protective packaging shipment list for the dispatch queue. You will be able to assign tracking codes once dispatched.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
              className="h-9 text-[9px] uppercase tracking-widest font-bold rounded-none"
            >
              Abort
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateShipment}
              className="h-9 text-[9px] uppercase tracking-widest font-bold rounded-none"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Verify Package Preparation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

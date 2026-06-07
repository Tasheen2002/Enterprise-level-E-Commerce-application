"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { OrderDetail } from "../../../../features/orders/components/OrderDetail";
import { ShipmentPanel } from "../../../../features/orders/components/ShipmentPanel";
import {
  useAdminOrder,
  useAdminOrderStatusHistory,
  useAdminOrderEvents,
  useAdminUpdateOrderStatus,
  useAdminUpdateOrderTotals,
  useAdminMarkOrderPaid,
  useAdminMarkOrderFulfilled,
  useAdminCancelOrder,
  useAdminCreateShipment,
  useAdminMarkShipmentShipped,
  useAdminMarkShipmentDelivered,
  useAdminUpdateShipmentTracking,
} from "../../../../features/orders/hooks/useAdminOrders";

export default function OrderDetailsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();

  const { data: order, isLoading: orderLoading, error: orderError, refetch: refetchOrder } = useAdminOrder(id);
  const { data: history = [], refetch: refetchHistory } = useAdminOrderStatusHistory(id);
  const { data: events = [], refetch: refetchEvents } = useAdminOrderEvents(id);

  // Mutations
  const updateStatusMutation = useAdminUpdateOrderStatus(id);
  const updateTotalsMutation = useAdminUpdateOrderTotals(id);
  const markPaidMutation = useAdminMarkOrderPaid(id);
  const markFulfilledMutation = useAdminMarkOrderFulfilled(id);
  const cancelMutation = useAdminCancelOrder(id);
  const createShipmentMutation = useAdminCreateShipment(id);
  const markShippedMutation = useAdminMarkShipmentShipped(id);
  const markDeliveredMutation = useAdminMarkShipmentDelivered(id);
  const updateTrackingMutation = useAdminUpdateShipmentTracking(id);

  const handleRefreshAll = () => {
    refetchOrder();
    refetchHistory();
    refetchEvents();
  };

  if (orderLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 text-gold animate-spin" />
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-muted/50">Recalling Archive...</span>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="text-center py-20 bg-stone-50 border border-stone-100 p-8 max-w-lg mx-auto my-12">
        <h2 className="text-lg font-light text-stone-850 tracking-wide mb-4 uppercase">Archive Not Resolved</h2>
        <p className="text-xs text-stone-500 mb-8 font-light leading-relaxed">
          The order matching ID <strong className="text-stone-700">{id || "N/A"}</strong> could not be located in database ledgers.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center justify-center h-12 px-6 border border-sand bg-white text-[10px] uppercase tracking-widest font-bold hover:bg-ivory/50 transition-colors"
        >
          Return to Ledger
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2">
      {/* Return link */}
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold text-slate-muted/60 hover:text-gold transition-all duration-300 group"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} />
          Return to Ledger
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-charcoal/40 font-bold uppercase tracking-widest">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span>Order Ledger</span>
            <span>/</span>
            <span className="text-charcoal/80">{order.orderNumber}</span>
          </div>
          <h1 className="text-2xl font-serif text-charcoal mt-1">Audit Order Details</h1>
          <p className="text-[11px] font-bold text-charcoal/70 uppercase tracking-widest mt-1">
            Examine billing coordinates, adjust financial summaries, and process courier dispatch packages.
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          className="flex items-center justify-center p-2.5 bg-white border border-sand/30 text-slate-muted hover:text-gold hover:border-gold transition-colors"
          title="Refresh ledger state"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Detailed View */}
      <OrderDetail
        order={order as any}
        statusHistory={history.map((h: any) => ({
          id: String(h.historyId),
          orderId: h.orderId || "",
          fromStatus: h.fromStatus,
          toStatus: h.toStatus || "",
          changedAt: h.changedAt || new Date().toISOString(),
          changedBy: h.changedBy || "System",
        }))}
        events={events.map((e: any) => ({
          id: String(e.eventId),
          orderId: e.orderId || "",
          eventType: e.eventType || "SYSTEM_EVENT",
          payload: e.payload || {},
          createdAt: e.createdAt || new Date().toISOString(),
        }))}
        onUpdateStatus={(status) => updateStatusMutation.mutateAsync(status)}
        onUpdateTotals={(totals) => updateTotalsMutation.mutateAsync(totals)}
        onMarkPaid={() => markPaidMutation.mutateAsync()}
        onMarkFulfilled={() => markFulfilledMutation.mutateAsync()}
        onCancel={() => cancelMutation.mutateAsync()}
      />

      <ShipmentPanel
        orderId={order.id || ""}
        shipments={(order as any).shipments || []}
        orderStatus={order.status || ""}
        onCreateShipment={(body) => createShipmentMutation.mutateAsync(body)}
        onMarkShipped={(shipmentId, body) =>
          markShippedMutation.mutateAsync({
            shipmentId,
            body: {
              carrier: body.carrier,
              service: body.service,
              trackingNumber: body.trackingNumber,
            },
          }, {
            onSuccess: () => {
              refetchOrder();
            }
          })
        }
        onMarkDelivered={(shipmentId, body) =>
          markDeliveredMutation.mutateAsync({
            shipmentId,
            body: {
              deliveredAt: body?.deliveredAt,
            },
          }, {
            onSuccess: () => {
              refetchOrder();
            }
          })
        }
        onUpdateTracking={(shipmentId, body) =>
          updateTrackingMutation.mutateAsync({
            shipmentId,
            body: {
              trackingNumber: body.trackingNumber,
              carrier: body.carrier,
              service: body.service,
            },
          }, {
            onSuccess: () => {
              refetchOrder();
            }
          })
        }
      />
    </div>
  );
}

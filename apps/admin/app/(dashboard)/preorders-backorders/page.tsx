"use client";

import React from "react";
import { PreordersBackorders } from "../../../features/orders/components/PreordersBackorders";
import {
  useAdminPreorders,
  useAdminBackorders,
  useAdminUpdatePreorderDate,
  useAdminUpdateBackorderEta,
  useAdminNotifyPreorder,
  useAdminNotifyBackorder,
} from "../../../features/orders/hooks/useAdminOrders";

export default function PreordersBackordersPage() {
  const { data: preordersResult, isLoading: isLoadingPreorders, refetch: refetchPreorders } = useAdminPreorders();
  const { data: backordersResult, isLoading: isLoadingBackorders, refetch: refetchBackorders } = useAdminBackorders();

  const preorders = preordersResult?.items ?? [];
  const backorders = backordersResult?.items ?? [];

  // Mutations
  const updatePreorderDateMutation = useAdminUpdatePreorderDate("");
  const updateBackorderEtaMutation = useAdminUpdateBackorderEta("");
  const notifyPreorderMutation = useAdminNotifyPreorder("");
  const notifyBackorderMutation = useAdminNotifyBackorder("");

  const handleRefresh = () => {
    refetchPreorders();
    refetchBackorders();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-charcoal/40 font-bold uppercase tracking-widest">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span className="text-charcoal/80">Allocations Registry</span>
          </div>
          <h1 className="text-3xl font-serif text-charcoal mt-1">Preorders & Backorders Registry</h1>
          <p className="text-[11px] font-bold text-charcoal/70 uppercase tracking-widest mt-1">
            Monitor future release bookings and delayed allocations. Update estimated arrival times and notify patrons.
          </p>
        </div>
      </div>

      <PreordersBackorders
        preorders={preorders as any}
        backorders={backorders as any}
        isLoadingPreorders={isLoadingPreorders}
        isLoadingBackorders={isLoadingBackorders}
        onRefresh={handleRefresh}
        onUpdatePreorderDate={(orderItemId, date) =>
          updatePreorderDateMutation.mutateAsync(date, {
            onSuccess: () => {
              refetchPreorders();
            }
          })
        }
        onUpdateBackorderEta={(orderItemId, date) =>
          updateBackorderEtaMutation.mutateAsync(date, {
            onSuccess: () => {
              refetchBackorders();
            }
          })
        }
        onNotifyPreorder={(orderItemId) =>
          notifyPreorderMutation.mutateAsync(undefined, {
            onSuccess: () => {
              refetchPreorders();
            }
          })
        }
        onNotifyBackorder={(orderItemId) =>
          notifyBackorderMutation.mutateAsync(undefined, {
            onSuccess: () => {
              refetchBackorders();
            }
          })
        }
      />
    </div>
  );
}

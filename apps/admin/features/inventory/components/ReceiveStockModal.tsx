import React, { useState, useEffect } from "react";
import { PurchaseOrder, POItem } from "../types";
import { inventoryApi } from "../api";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";

interface ReceiveStockModalProps {
  purchaseOrder: PurchaseOrder;
  poItems: POItem[];
  locations: any[];
  variantMap: Record<string, { sku: string; size: string; productName: string }>;
  onClose: () => void;
  onRefreshPO: (po: PurchaseOrder) => Promise<void>;
}

export function ReceiveStockModal({
  purchaseOrder,
  poItems,
  locations,
  variantMap,
  onClose,
  onRefreshPO
}: ReceiveStockModalProps) {
  const [locationId, setLocationId] = useState(locations[0]?.locationId || locations[0]?.id || "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    // Default quantities to remaining quantities
    const initialQty: Record<string, number> = {};
    poItems.forEach(item => {
      initialQty[item.variantId] = item.remainingQty;
    });
    setQuantities(initialQty);
  }, [poItems]);

  const handleSubmit = async () => {
    if (!locationId) {
      toast.error("Please select a target warehouse location");
      return;
    }

    const itemsToReceive = Object.entries(quantities)
      .map(([variantId, qty]) => ({ variantId, receivedQty: qty }))
      .filter(item => item.receivedQty > 0);

    if (itemsToReceive.length === 0) {
      toast.error("Must receive at least 1 quantity of an item");
      return;
    }

    try {
      const updatedPO = await inventoryApi.receivePOItems(purchaseOrder.poId, locationId, itemsToReceive);
      toast.success("Shipment received successfully. Stock levels updated.");
      await onRefreshPO(updatedPO); // Trigger detailing drawer update
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to process stock receival");
    }
  };

  const pendingItems = poItems.filter(item => !item.isFullyReceived);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/30">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden border border-charcoal/10">
        <div className="px-6 py-4 border-b border-charcoal/10 bg-charcoal/[0.02]">
          <h3 className="font-bold text-charcoal font-serif text-sm">Fulfill Incoming Shipment Count</h3>
        </div>
        
        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Receiving Facility / Location *</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy text-xs font-bold text-charcoal"
            >
              {locations.map(loc => (
                <option key={loc.locationId || loc.id} value={loc.locationId || loc.id}>{loc.name} ({loc.type})</option>
              ))}
            </select>
          </div>

          <div className="border-t border-charcoal/5 pt-4 space-y-3">
            <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest">Input Quantities Received</label>
            
            <div className="divide-y divide-charcoal/5">
              {pendingItems.length === 0 ? (
                <p className="text-xs italic text-charcoal/40 text-center py-4">No pending items left to receive.</p>
              ) : (
                pendingItems.map(item => {
                  const entry = variantMap[item.variantId];
                  return (
                    <div key={item.variantId} className="py-2.5 flex items-center justify-between text-xs font-medium text-charcoal">
                      <div>
                        {entry ? (
                          <>
                            <div className="font-bold">{entry.productName}</div>
                            <div className="text-[10px] text-charcoal/40 font-mono mt-0.5">SKU: {entry.sku} {entry.size ? `(${entry.size})` : ""}</div>
                          </>
                        ) : (
                          <span className="font-mono">{item.variantId.substring(0, 8)}</span>
                        )}
                        <div className="text-[9px] text-charcoal/50 mt-1">Expected balance: <span className="font-bold">{item.remainingQty}</span></div>
                      </div>

                      <input
                        type="number"
                        min={0}
                        max={item.remainingQty}
                        value={quantities[item.variantId] || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setQuantities(prev => ({ 
                            ...prev, 
                            [item.variantId]: isNaN(val) ? 0 : Math.min(val, item.remainingQty)
                          }));
                        }}
                        className="w-16 text-center py-1 bg-stone-50 border border-charcoal/10 rounded focus:outline-none focus:border-burgundy font-bold text-xs"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-charcoal/10 bg-charcoal/[0.02] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-charcoal/60 hover:text-charcoal transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-emerald-700 text-white rounded-full hover:bg-emerald-800 transition-colors text-xs font-bold tracking-widest uppercase flex items-center gap-1.5"
          >
            <PackageCheck className="w-3.5 h-3.5" /> Fulfill Receival
          </button>
        </div>
      </div>
    </div>
  );
}

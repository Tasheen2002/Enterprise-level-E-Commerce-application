import React, { useState, useEffect } from "react";
import { Stock } from "../types";
import { inventoryApi } from "../api";
import { toast } from "sonner";

interface ThresholdModalProps {
  thresholdTarget: Stock | null;
  variantMap: Record<string, { sku: string; size: string; productName: string }>;
  onClose: () => void;
  onRefresh: () => void;
}

export function ThresholdModal({
  thresholdTarget,
  variantMap,
  onClose,
  onRefresh
}: ThresholdModalProps) {
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [safetyStock, setSafetyStock] = useState(0);

  useEffect(() => {
    if (thresholdTarget) {
      setLowStockThreshold(thresholdTarget.lowStockThreshold || 5);
      setSafetyStock(thresholdTarget.safetyStock || 0);
    }
  }, [thresholdTarget]);

  const handleSubmit = async () => {
    if (!thresholdTarget) return;
    try {
      await inventoryApi.setStockThresholds(
        thresholdTarget.variantId,
        thresholdTarget.locationId,
        lowStockThreshold,
        safetyStock
      );
      toast.success("Stock safety thresholds updated successfully");
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update safety thresholds");
    }
  };

  const variant = thresholdTarget ? variantMap[thresholdTarget.variantId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal/60 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-lg w-[400px] overflow-hidden border border-charcoal/10">
        <div className="px-6 py-4 border-b border-charcoal/10 bg-charcoal/[0.02]">
          <h3 className="font-bold text-charcoal">Set Stock Thresholds</h3>
        </div>
        
        <div className="p-6 space-y-4 text-charcoal">
          {thresholdTarget && (
            <div>
              <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1">Variant</label>
              <div className="px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg font-medium">
                {variant ? (
                  <div>
                    <div className="font-bold text-sm">{variant.productName}</div>
                    <div className="text-xs text-charcoal/50 font-mono mt-0.5">{variant.sku} {variant.size ? `(${variant.size})` : ""}</div>
                  </div>
                ) : (
                  <span className="font-mono text-xs">{thresholdTarget.variantId}</span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Low Threshold</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy font-bold text-xs text-charcoal"
              />
              <p className="text-[9px] text-charcoal/40 mt-1">Triggers warning status when stock falls to this or lower.</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Safety Stock</label>
              <input
                type="number"
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy font-bold text-xs text-charcoal"
              />
              <p className="text-[9px] text-charcoal/40 mt-1">Reserve buffer stock count.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-charcoal/[0.02] border-t border-charcoal/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-colors text-[11px] font-bold tracking-widest uppercase text-charcoal"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[11px] font-bold tracking-widest uppercase"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

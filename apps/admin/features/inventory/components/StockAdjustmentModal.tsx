import React, { useState, useEffect } from "react";
import { Stock } from "../types";
import { inventoryApi } from "../api";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";

interface StockAdjustmentModalProps {
  adjustTarget: Partial<Stock> | null;
  initialDelta?: number;
  locations: any[];
  variantMap: Record<string, { sku: string; size: string; productName: string }>;
  onClose: () => void;
  onRefresh: () => void;
}

export function StockAdjustmentModal({
  adjustTarget,
  initialDelta = 1,
  locations,
  variantMap,
  onClose,
  onRefresh
}: StockAdjustmentModalProps) {
  const isRowSpecific = !!adjustTarget?.variantId;
  const isReduceMode = isRowSpecific && initialDelta < 0;

  const [delta, setDelta] = useState(Math.abs(initialDelta));
  const [reason, setReason] = useState<"return" | "adjustment" | "po" | "order" | "damage" | "theft">("adjustment");
  
  // Dynamic pickers for empty adjust target
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [targetVariantId, setTargetVariantId] = useState(adjustTarget?.variantId || "");
  const [targetLocationId, setTargetLocationId] = useState(adjustTarget?.locationId || "");

  useEffect(() => {
    if (!adjustTarget?.variantId) {
      // Fetch products for fresh adjustments
      inventoryApi.getProducts().then(prods => {
        setProducts(prods);
      });
      setDelta(0);
    } else {
      setDelta(Math.abs(initialDelta));
    }
  }, [adjustTarget, initialDelta]);

  useEffect(() => {
    if (selectedProductId) {
      api.GET("/api/v1/products/{productId}/variants", { 
        params: { path: { productId: selectedProductId }, query: { limit: 100, page: 1, sortBy: "createdAt", sortOrder: "desc" } } 
      }).then(res => {
        if (res.data?.success && res.data.data.items) {
          const sortedItems = [...(res.data.data.items as any[])].sort((a, b) => {
            const sizeA = a.size ? parseFloat(a.size) : NaN;
            const sizeB = b.size ? parseFloat(b.size) : NaN;
            
            if (!isNaN(sizeA) && !isNaN(sizeB)) return sizeA - sizeB;
            if (!isNaN(sizeA)) return -1;
            if (!isNaN(sizeB)) return 1;
            
            const strA = a.size || "";
            const strB = b.size || "";
            return strA.localeCompare(strB);
          });
          setProductVariants(sortedItems);
          if (sortedItems.length > 0) {
            setTargetVariantId(sortedItems[0].variantId || sortedItems[0].id);
          }
        } else {
          setProductVariants([]);
        }
      });
    } else {
      setProductVariants([]);
    }
  }, [selectedProductId]);

  const handleSubmit = async () => {
    const finalVariantId = adjustTarget?.variantId || targetVariantId;
    const finalLocationId = adjustTarget?.locationId || targetLocationId;

    if (!finalVariantId || !finalLocationId) {
      toast.error("Variant and Location are required to adjust stock");
      return;
    }

    const finalDelta = isReduceMode ? -Math.abs(delta) : isRowSpecific ? Math.abs(delta) : delta;

    try {
      try {
        // Attempt to adjust quantity delta
        await inventoryApi.adjustStock(finalVariantId, finalLocationId, finalDelta, reason);
      } catch (err: any) {
        // Fallback to direct initial addition if stock record does not exist
        if (err.message?.includes("not found") || err.message?.includes("404")) {
          await inventoryApi.addStock(finalVariantId, finalLocationId, finalDelta, reason);
        } else {
          throw err;
        }
      }

      toast.success("Stock quantity updated successfully");
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock quantity");
    }
  };

  const rowVariant = isRowSpecific ? variantMap[adjustTarget!.variantId!] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal/60 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-lg w-[400px] overflow-hidden border border-charcoal/10">
        <div className="px-6 py-4 border-b border-charcoal/10 bg-charcoal/[0.02]">
          <h3 className="font-bold text-charcoal">
            {isReduceMode ? "Reduce Stock" : isRowSpecific ? "Add Stock" : "Adjust Stock"}
          </h3>
        </div>
        
        <div className="p-6 space-y-4 text-charcoal">
          {isRowSpecific ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1">Target Variant</label>
                <div className="px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg font-medium">
                  {rowVariant ? (
                    <div>
                      <div className="font-bold text-sm">{rowVariant.productName}</div>
                      <div className="text-xs text-charcoal/50 font-mono mt-0.5">{rowVariant.sku} {rowVariant.size ? `(${rowVariant.size})` : ""}</div>
                    </div>
                  ) : (
                    <span className="font-mono text-xs">{adjustTarget?.variantId}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1">Location</label>
                <div className="px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg font-medium text-sm">
                  {locations.find(l => (l.locationId || l.id) === adjustTarget?.locationId)?.name || adjustTarget?.locationId}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setTargetVariantId("");
                  }}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-semibold text-charcoal"
                >
                  <option value="">Select a Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Variant *</label>
                <select
                  value={targetVariantId}
                  onChange={(e) => setTargetVariantId(e.target.value)}
                  disabled={!selectedProductId && productVariants.length === 0}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-semibold text-charcoal disabled:opacity-50"
                >
                  <option value="">Select a Variant</option>
                  {productVariants.map(v => (
                    <option key={v.variantId || v.id} value={v.variantId || v.id}>{v.sku} {v.size ? `(${v.size})` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Location *</label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-semibold text-charcoal"
                >
                  <option value="">Select a Location</option>
                  {locations.map(loc => (
                    <option key={loc.locationId || loc.id} value={loc.locationId || loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">
                {isReduceMode ? "Quantity to Reduce *" : isRowSpecific ? "Quantity to Add *" : "Delta (+/-) *"}
              </label>
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy font-bold text-xs text-charcoal"
              />
              {isRowSpecific && (
                <p className="text-[9px] text-stone-400 mt-1 uppercase font-semibold tracking-wider">
                  {isReduceMode 
                    ? `Subtracts ${Math.abs(delta)} units`
                    : `Adds ${Math.abs(delta)} units`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-semibold text-charcoal"
              >
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
                <option value="po">Purchase Order</option>
                <option value="order">Order Fulfillment</option>
                <option value="damage">Damage</option>
                <option value="theft">Theft</option>
              </select>
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
            className="px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-xs font-bold tracking-widest uppercase"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

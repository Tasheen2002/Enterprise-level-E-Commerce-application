import React, { useState } from "react";
import { Supplier } from "../types";
import { inventoryApi } from "../api";
import { Search, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CreatePODrawerProps {
  suppliers: Supplier[];
  productVariants: any[];
  variantMap: Record<string, { sku: string; size: string; productName: string }>;
  initialSupplierId?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function CreatePODrawer({
  suppliers,
  productVariants,
  variantMap,
  initialSupplierId = "",
  onClose,
  onRefresh
}: CreatePODrawerProps) {
  const [supplierId, setSupplierId] = useState(initialSupplierId || (suppliers[0]?.supplierId ?? ""));
  const [eta, setEta] = useState("");
  const [items, setItems] = useState<Array<{ variantId: string; orderedQty: number }>>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddLine = (variantId: string) => {
    if (!variantId) return;
    if (items.some(i => i.variantId === variantId)) {
      toast.error("Variant already added to this purchase order");
      return;
    }
    setItems(prev => [...prev, { variantId, orderedQty: 10 }]);
  };

  const handleRemoveLine = (variantId: string) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const handleQtyChange = (variantId: string, qty: number) => {
    if (qty < 1) qty = 1;
    setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, orderedQty: qty } : i));
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Please select a B2B supplier");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one product variant item");
      return;
    }

    let isoEta: string | undefined = undefined;
    if (eta) {
      const etaDate = new Date(eta);
      if (!isNaN(etaDate.getTime())) {
        isoEta = etaDate.toISOString();
      }
    }

    try {
      await inventoryApi.createPOWithItems(supplierId, isoEta, items);
      toast.success("Purchase Order drafted successfully");
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order");
    }
  };

  // Filter variants for auto-complete search
  const filteredVariants = productVariants.filter(v => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    return v.sku.toLowerCase().includes(q) || v.productName.toLowerCase().includes(q) || (v.size && v.size.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/20">
      <div className="bg-white rounded-xl shadow-2xl w-[680px] max-h-[90vh] overflow-hidden border border-charcoal/10 flex flex-col justify-between text-charcoal">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-charcoal/10 flex items-center justify-between bg-charcoal/[0.02]">
            <h3 className="font-serif text-base font-bold text-charcoal">Draft Purchase Order</h3>
            <button onClick={onClose} className="text-charcoal/40 hover:text-charcoal font-bold text-xl leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh]">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy text-xs font-semibold text-charcoal"
                >
                  {suppliers.map(s => (
                    <option key={s.supplierId} value={s.supplierId}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Expected Delivery Date (ETA)</label>
                <input
                  type="date"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-semibold text-charcoal"
                />
              </div>
            </div>

            {/* Add Variant Search */}
            <div className="border-t border-charcoal/5 pt-4 space-y-2">
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest">Search Catalog Variants to Order</label>
              <div className="relative">
                <Search className="w-4 h-4 text-charcoal/30 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search SKU or Product Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-charcoal/10 rounded-lg bg-[#FAF9F6] placeholder-charcoal/30 text-xs focus:outline-none focus:border-burgundy text-charcoal font-medium"
                />
              </div>

              {/* Filtered Search Results */}
              {searchQuery && (
                <div className="max-h-48 overflow-y-auto border border-charcoal/10 bg-white rounded-lg shadow-inner divide-y divide-charcoal/5">
                  {filteredVariants.length === 0 ? (
                    <p className="p-3 text-xs italic text-charcoal/40 text-center">No matching variants found</p>
                  ) : (
                    filteredVariants.map(v => (
                      <div 
                        key={v.id || v.variantId} 
                        onClick={() => {
                          handleAddLine(v.id || v.variantId);
                          setSearchQuery("");
                        }}
                        className="p-3 hover:bg-stone-50 transition-colors flex items-center justify-between text-xs cursor-pointer font-medium text-charcoal"
                      >
                        <div>
                          <div className="font-bold">{v.productName}</div>
                          <div className="text-[10px] text-charcoal/50 font-mono mt-0.5">SKU: {v.sku} {v.size ? `(${v.size})` : ""}</div>
                        </div>
                        <span className="text-[10px] text-burgundy font-bold uppercase tracking-wider flex items-center gap-1">
                          <PlusCircle className="w-3.5 h-3.5" /> Select
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="border-t border-charcoal/5 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Order Line Items</h4>
              
              {items.length === 0 ? (
                <div className="py-8 text-center text-xs italic text-charcoal/40 border border-dashed border-charcoal/10 rounded-lg">
                  No items added yet. Search variants above to add.
                </div>
              ) : (
                <div className="border border-charcoal/10 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-charcoal/[0.01] border-b border-charcoal/10 text-[9px] font-bold text-charcoal/50 uppercase tracking-widest">
                        <th className="py-2.5 px-4">Variant SKU & Product</th>
                        <th className="py-2.5 px-4 text-center w-28">Order Qty</th>
                        <th className="py-2.5 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal/5 text-charcoal">
                      {items.map(item => {
                        const entry = variantMap[item.variantId];
                        return (
                          <tr key={item.variantId} className="hover:bg-charcoal/[0.005]">
                            <td className="py-3 px-4 font-semibold">
                              {entry ? (
                                <div>
                                  <div>{entry.productName}</div>
                                  <div className="text-[10px] text-charcoal/40 font-mono mt-0.5">SKU: {entry.sku} {entry.size ? `(${entry.size})` : ""}</div>
                                </div>
                              ) : (
                                <span className="font-mono">{item.variantId.substring(0, 8)}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="number"
                                min={1}
                                max={10000}
                                value={item.orderedQty}
                                onChange={(e) => handleQtyChange(item.variantId, parseInt(e.target.value, 10) || 1)}
                                className="w-20 text-center py-1 bg-stone-50 border border-charcoal/10 rounded focus:outline-none focus:border-burgundy font-bold text-xs"
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRemoveLine(item.variantId)}
                                className="p-1 text-charcoal/30 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
            className="px-6 py-2.5 bg-charcoal text-white rounded-full hover:bg-burgundy text-xs font-bold tracking-widest uppercase transition-colors shadow-sm"
          >
            Draft Order
          </button>
        </div>
      </div>
    </div>
  );
}

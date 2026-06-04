import React from "react";
import { Stock } from "../types";
import { ArrowUpRight, ArrowDownRight, Sliders } from "lucide-react";

interface StockTableProps {
  stocks: Stock[];
  locations: any[];
  variantMap: Record<string, { sku: string; size: string; productName: string }>;
  searchQuery: string;
  isLoading: boolean;
  onAdjust: (stock: Stock, delta: number) => void;
  onEditThreshold: (stock: Stock) => void;
}

export function StockTable({
  stocks,
  locations,
  variantMap,
  searchQuery,
  isLoading,
  onAdjust,
  onEditThreshold
}: StockTableProps) {
  
  // Filter stocks
  const filteredStocks = stocks.filter((stock) => {
    const variant = variantMap[stock.variantId];
    const location = locations.find(loc => (loc.locationId || loc.id) === stock.locationId);
    
    const searchLower = searchQuery.toLowerCase();
    const matchesVariantId = stock.variantId.toLowerCase().includes(searchLower);
    const matchesLocationId = stock.locationId.toLowerCase().includes(searchLower);
    const matchesSku = variant?.sku?.toLowerCase().includes(searchLower) || false;
    const matchesProductName = variant?.productName?.toLowerCase().includes(searchLower) || false;
    const matchesLocationName = location?.name?.toLowerCase().includes(searchLower) || false;
    
    return matchesVariantId || matchesLocationId || matchesSku || matchesProductName || matchesLocationName;
  }).sort((a, b) => {
    const varA = variantMap[a.variantId];
    const varB = variantMap[b.variantId];
    
    const prodNameA = varA?.productName || "";
    const prodNameB = varB?.productName || "";
    
    const prodCompare = prodNameA.localeCompare(prodNameB);
    if (prodCompare !== 0) return prodCompare;
    
    const sizeA = varA?.size ? parseFloat(varA.size) : NaN;
    const sizeB = varB?.size ? parseFloat(varB.size) : NaN;
    
    if (!isNaN(sizeA) && !isNaN(sizeB)) return sizeA - sizeB;
    if (!isNaN(sizeA)) return -1;
    if (!isNaN(sizeB)) return 1;
    
    const strA = varA?.size || "";
    const strB = varB?.size || "";
    return strA.localeCompare(strB);
  });

  return (
    <div className="bg-white border border-charcoal/5 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#EBE6D9]/40 border-b border-charcoal/5 text-[10px] font-bold text-charcoal/50 uppercase tracking-widest">
            <th className="py-4 px-6 font-medium">Variant</th>
            <th className="py-4 px-6 font-medium">Location</th>
            <th className="py-4 px-6 font-medium text-right">Available</th>
            <th className="py-4 px-6 font-medium text-right">On Hand</th>
            <th className="py-4 px-6 font-medium text-right">Reserved</th>
            <th className="py-4 px-6 font-medium text-center">Status</th>
            <th className="py-4 px-6 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal/5 text-sm text-charcoal/80">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-charcoal/40">Loading inventory...</td>
            </tr>
          ) : filteredStocks.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-charcoal/60">
                No inventory records found.
              </td>
            </tr>
          ) : (
            filteredStocks.map((stock) => {
              const isOutOfStock = stock.available <= 0;
              const isLowStock = !isOutOfStock && stock.available <= (stock.lowStockThreshold || 5);

              const variant = variantMap[stock.variantId];
              const location = locations.find(loc => (loc.locationId || loc.id) === stock.locationId);

              return (
                <tr key={`${stock.variantId}-${stock.locationId}`} className="hover:bg-[#F9F8F4]/60 transition-colors">
                  <td className="py-4 px-6 text-charcoal font-medium">
                    {variant ? (
                      <div>
                        <div className="font-bold">{variant.productName}</div>
                        <div className="text-xs text-charcoal/50 font-mono mt-0.5">{variant.sku} {variant.size ? `(${variant.size})` : ""}</div>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px]">{stock.variantId}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-charcoal/80 font-medium">
                    {location ? location.name : <span className="font-mono text-[11px]">{stock.locationId}</span>}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-charcoal">
                    {stock.available}
                  </td>
                  <td className="py-4 px-6 text-right text-charcoal/60">
                    {stock.onHand}
                  </td>
                  <td className="py-4 px-6 text-right text-charcoal/60">
                    {stock.reserved}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center">
                      <span title={isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "Healthy"}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-400' : isLowStock ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onAdjust(stock, 1)}
                        className="p-1.5 text-charcoal/40 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                        title="Add Stock"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onAdjust(stock, -1)}
                        className="p-1.5 text-charcoal/40 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        title="Reduce Stock"
                      >
                        <ArrowDownRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditThreshold(stock)}
                        className="p-1.5 text-charcoal/40 hover:text-burgundy rounded hover:bg-burgundy/5 transition-colors"
                        title="Set Thresholds"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

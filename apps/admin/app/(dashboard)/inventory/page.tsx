"use client";

import React, { useState } from "react";
import { Stock } from "../../../features/inventory/types";
import { useAdminInventory } from "../../../features/inventory/hooks/useAdminInventory";
import { StockTable } from "../../../features/inventory/components/StockTable";
import { StockAdjustmentModal } from "../../../features/inventory/components/StockAdjustmentModal";
import { CreateLocationModal } from "../../../features/inventory/components/CreateLocationModal";
import { ThresholdModal } from "../../../features/inventory/components/ThresholdModal";
import { Box, Search, RefreshCw, Plus } from "lucide-react";

export default function InventoryPage() {
  const { stocks, locations, variantMap, loading, refetch, refetchLocations } = useAdminInventory();
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Drawer Toggles
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Partial<Stock> | null>(null);
  
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [thresholdTarget, setThresholdTarget] = useState<Stock | null>(null);

  const handleAdjustTrigger = (stock: Stock, _delta: number) => {
    setAdjustTarget(stock);
    setIsAdjusting(true);
  };

  const handleEditThresholdTrigger = (stock: Stock) => {
    setThresholdTarget(stock);
    setIsEditingThreshold(true);
  };

  return (
    <div className="flex flex-col bg-[#FAF9F6] min-h-screen">
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-charcoal/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal flex items-center gap-2">
            <Box className="w-5 h-5 text-burgundy" />
            Inventory Stock
          </h1>
          <p className="text-sm text-charcoal/50 mt-1">
            Manage global inventory levels and warehouses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            className="flex items-center justify-center p-2 text-charcoal/40 hover:text-charcoal border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-all"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <button
            onClick={() => setIsCreatingLocation(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-charcoal border border-charcoal/20 rounded-full hover:bg-charcoal/5 transition-colors text-[11px] font-bold tracking-widest uppercase shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
          
          <button
            onClick={() => {
              setAdjustTarget({ variantId: "", locationId: "" });
              setIsAdjusting(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[11px] font-bold tracking-widest uppercase shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Adjust Stock
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
            <div className="relative flex-1 min-w-[280px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search by Product, SKU, Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F9F8F4] border border-charcoal/10 pl-9 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-charcoal focus:outline-none focus:border-burgundy rounded-xl transition-colors"
              />
            </div>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/60">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                Healthy
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                Low Stock
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                Out of Stock
              </div>
            </div>
          </div>

          <StockTable
            stocks={stocks}
            locations={locations}
            variantMap={variantMap}
            searchQuery={searchQuery}
            isLoading={loading}
            onAdjust={handleAdjustTrigger}
            onEditThreshold={handleEditThresholdTrigger}
          />
        </div>
      </div>

      {isAdjusting && (
        <StockAdjustmentModal
          adjustTarget={adjustTarget}
          locations={locations}
          variantMap={variantMap}
          onClose={() => setIsAdjusting(false)}
          onRefresh={refetch}
        />
      )}

      {isCreatingLocation && (
        <CreateLocationModal
          onClose={() => setIsCreatingLocation(false)}
          onRefresh={refetchLocations}
        />
      )}

      {isEditingThreshold && thresholdTarget && (
        <ThresholdModal
          thresholdTarget={thresholdTarget}
          variantMap={variantMap}
          onClose={() => setIsEditingThreshold(false)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Stock } from "../../../features/inventory/types";
import { inventoryApi } from "../../../features/inventory/api";
import { StockTable } from "../../../features/inventory/components/StockTable";
import { StockAdjustmentModal } from "../../../features/inventory/components/StockAdjustmentModal";
import { CreateLocationModal } from "../../../features/inventory/components/CreateLocationModal";
import { ThresholdModal } from "../../../features/inventory/components/ThresholdModal";
import { Box, Search, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, { sku: string; size: string; productName: string }>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Drawer Toggles
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Partial<Stock> | null>(null);
  
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [thresholdTarget, setThresholdTarget] = useState<Stock | null>(null);

  const fetchStocks = async () => {
    setIsLoading(true);
    try {
      const res = await inventoryApi.fetchStocks(100, 0);
      setStocks(res);
    } catch (err) {
      toast.error("Failed to load inventory stock levels");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const locList = await inventoryApi.getLocations();
      setLocations(locList);
    } catch (e) {
      console.error("Failed to load facility locations", e);
    }
  };

  const fetchAllVariants = async () => {
    try {
      const productsList = await inventoryApi.getProducts();
      const newMap: Record<string, { sku: string; size: string; productName: string }> = {};

      // Fetch variants in chunks of 5
      const chunkSize = 5;
      for (let i = 0; i < productsList.length; i += chunkSize) {
        const chunk = productsList.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (prod) => {
          try {
            const variants = await inventoryApi.getProductVariants(prod.id!);
            if (variants) {
              variants.forEach((v: any) => {
                newMap[v.variantId || v.id] = {
                  sku: v.sku,
                  size: v.size || "",
                  productName: prod.title || "",
                };
              });
            }
          } catch (err) {
            console.error(`Failed to fetch variants for product ${prod.id}`, err);
          }
        }));
      }

      setVariantMap(newMap);
    } catch (e) {
      console.error("Failed to map variant database entries", e);
    }
  };

  useEffect(() => {
    const handleInitialFetch = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchStocks(),
        fetchLocations(),
        fetchAllVariants()
      ]);
      setIsLoading(false);
    };
    handleInitialFetch();
  }, []);

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
      {/* Header */}
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
            onClick={fetchStocks}
            className="flex items-center justify-center p-2 text-charcoal/40 hover:text-charcoal border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-all"
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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

      {/* Main Table Panel */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Active Search & Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-charcoal/40" />
              </div>
              <input
                type="text"
                placeholder="Search by Product, SKU, Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-full leading-5 bg-white placeholder-charcoal/30 focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy sm:text-sm transition-all shadow-sm text-charcoal"
              />
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-charcoal/60">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                Healthy
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                Low Stock
              </div>
              <div className="flex items-center gap-1.5">
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
            isLoading={isLoading}
            onAdjust={handleAdjustTrigger}
            onEditThreshold={handleEditThresholdTrigger}
          />
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {isAdjusting && (
        <StockAdjustmentModal
          adjustTarget={adjustTarget}
          locations={locations}
          variantMap={variantMap}
          onClose={() => setIsAdjusting(false)}
          onRefresh={fetchStocks}
        />
      )}

      {/* REGISTER LOCATION MODAL */}
      {isCreatingLocation && (
        <CreateLocationModal
          onClose={() => setIsCreatingLocation(false)}
          onRefresh={fetchLocations}
        />
      )}

      {/* SET THRESHOLDS MODAL */}
      {isEditingThreshold && thresholdTarget && (
        <ThresholdModal
          thresholdTarget={thresholdTarget}
          variantMap={variantMap}
          onClose={() => setIsEditingThreshold(false)}
          onRefresh={fetchStocks}
        />
      )}
    </div>
  );
}

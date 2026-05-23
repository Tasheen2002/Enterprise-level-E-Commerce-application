"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../lib/api-client";
import { Box, Search, RefreshCw, AlertCircle, Plus, ArrowUpRight, ArrowDownRight, Sliders } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Stock {
  id: string;
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export default function InventoryPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Partial<Stock> | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustReason, setAdjustReason] = useState<"return" | "adjustment" | "po" | "order" | "damage" | "theft">("adjustment");

  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", type: "warehouse" as const });

  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [variantMap, setVariantMap] = useState<Record<string, { sku: string; size: string; productName: string }>>({});
  
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [thresholdTarget, setThresholdTarget] = useState<Stock | null>(null);
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState(5);
  const [safetyStockInput, setSafetyStockInput] = useState(0);

  const fetchStocks = async () => {
    setIsLoading(true);
    try {
      const res = await api.GET("/api/v1/stocks", {
        params: { query: { limit: 100, offset: 0, sortBy: "available", sortOrder: "desc" } },
      });
      if (res.data?.success && res.data.data && 'items' in res.data.data) {
        setStocks(res.data.data.items as any);
      } else {
        setStocks([]);
      }
    } catch (err) {
      toast.error("Failed to load inventory");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.GET("/api/v1/locations", { params: { query: { limit: 100, offset: 0 } } });
      if (res.data?.success && res.data.data.items) {
        setLocations(res.data.data.items as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllVariants = async () => {
    try {
      const prodRes = await api.GET("/api/v1/products", { params: { query: { limit: 100, page: 1, sortBy: "createdAt", sortOrder: "desc" } } });
      if (prodRes.data?.success && prodRes.data.data.items) {
        const productsList = prodRes.data.data.items;
        const newMap: Record<string, { sku: string; size: string; productName: string }> = {};

        // Fetch variants in chunks of 10 to eliminate browser connection exhaustion & backend storms
        const chunkSize = 10;
        for (let i = 0; i < productsList.length; i += chunkSize) {
          const chunk = productsList.slice(i, i + chunkSize);
          await Promise.all(chunk.map(async (prod) => {
            try {
              const varRes = await api.GET("/api/v1/products/{productId}/variants", {
                params: { path: { productId: prod.id! }, query: { limit: 100, page: 1, sortBy: "createdAt", sortOrder: "desc" } }
              });
              if (varRes.data?.success && varRes.data.data.items) {
                varRes.data.data.items.forEach((v: any) => {
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
      }
    } catch (e) {
      console.error("Failed to fetch all variants", e);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchLocations();
    fetchAllVariants();
  }, []);

  useEffect(() => {
    if (isAdjusting) {
      if (locations.length === 0) {
        fetchLocations();
      }
      if (products.length === 0) {
        api.GET("/api/v1/products", { params: { query: { limit: 100, page: 1, sortBy: "createdAt", sortOrder: "desc" } } })
          .then(res => {
            if (res.data?.success && res.data.data.items) {
              setProducts(res.data.data.items as any);
            }
          });
      }
    }
  }, [isAdjusting]);

  useEffect(() => {
    if (selectedProductId) {
      api.GET("/api/v1/products/{productId}/variants", { 
        params: { path: { productId: selectedProductId }, query: { limit: 100, page: 1, sortBy: "createdAt", sortOrder: "desc" } } 
      }).then(res => {
        if (res.data?.success && res.data.data.items) {
          const sortedItems = [...(res.data.data.items as any[])].sort((a, b) => {
            const sizeA = a.size ? parseFloat(a.size) : NaN;
            const sizeB = b.size ? parseFloat(b.size) : NaN;
            
            if (!isNaN(sizeA) && !isNaN(sizeB)) {
              return sizeA - sizeB;
            }
            if (!isNaN(sizeA)) return -1;
            if (!isNaN(sizeB)) return 1;
            
            const strA = a.size || "";
            const strB = b.size || "";
            return strA.localeCompare(strB);
          });
          setProductVariants(sortedItems);
          if (!adjustTarget?.variantId && sortedItems.length > 0) {
            const firstVar: any = sortedItems[0];
            setAdjustTarget(prev => ({ ...prev, variantId: firstVar.variantId || firstVar.id }));
          }
        } else {
          setProductVariants([]);
        }
      });
    } else {
      setProductVariants([]);
    }
  }, [selectedProductId]);

  const handleAdjustSubmit = async () => {
    if (!adjustTarget?.variantId || !adjustTarget?.locationId) {
      toast.error("Variant ID and Location ID are required");
      return;
    }
    try {
      const res = await api.POST("/api/v1/stocks/adjust", {
        body: {
          variantId: adjustTarget.variantId,
          locationId: adjustTarget.locationId,
          quantityDelta: adjustDelta,
          reason: adjustReason,
        },
      }) as any;
      
      if (res.error) {
        if (res.response?.status === 404) {
          // If stock doesn't exist, we must add it instead of adjusting
          const addRes = await api.POST("/api/v1/stocks/add", {
            body: {
              variantId: adjustTarget.variantId,
              locationId: adjustTarget.locationId,
              quantity: adjustDelta,
              reason: adjustReason,
            },
          }) as any;
          if (addRes.error) throw new Error("Add failed");
        } else {
          throw new Error("Adjustment failed: " + (res.error as any).message);
        }
      }
      
      toast.success("Stock updated successfully");
      setIsAdjusting(false);
      setAdjustTarget(null);
      setAdjustDelta(0);
      fetchStocks();
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock");
    }
  };

  const handleCreateLocation = async () => {
    if (!newLocation.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    try {
      const res = await api.POST("/api/v1/locations", {
        body: {
          name: newLocation.name,
          type: newLocation.type,
        },
      });
      if (res.error) throw new Error("Failed to create location");
      toast.success("Location created successfully");
      setIsCreatingLocation(false);
      setNewLocation({ name: "", type: "warehouse" });
      fetchLocations();
    } catch (err) {
      toast.error("Failed to create location");
    }
  };

  const handleSaveThreshold = async () => {
    if (!thresholdTarget) return;
    try {
      const res = await api.PATCH("/api/v1/stocks/{variantId}/{locationId}/thresholds", {
        params: {
          path: {
            variantId: thresholdTarget.variantId,
            locationId: thresholdTarget.locationId,
          },
        },
        body: {
          lowStockThreshold: lowStockThresholdInput,
          safetyStock: safetyStockInput,
        },
      }) as any;

      if (res.error) throw new Error("Failed to update thresholds");
      
      toast.success("Stock thresholds updated successfully");
      setIsEditingThreshold(false);
      setThresholdTarget(null);
      fetchStocks();
    } catch (err: any) {
      toast.error(err.message || "Failed to update thresholds");
    }
  };

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
    
    if (!isNaN(sizeA) && !isNaN(sizeB)) {
      return sizeA - sizeB;
    }
    if (!isNaN(sizeA)) return -1;
    if (!isNaN(sizeB)) return 1;
    
    const strA = varA?.size || "";
    const strB = varB?.size || "";
    return strA.localeCompare(strB);
  });

  return (
    <div className="flex flex-col bg-[#FAF9F6]">
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
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsCreatingLocation(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-charcoal border border-charcoal/20 rounded-full hover:bg-charcoal/5 transition-colors text-[11px] font-bold tracking-widest uppercase"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
          <button
            onClick={() => {
              setAdjustTarget({ variantId: "", locationId: "" });
              setAdjustDelta(0);
              setIsAdjusting(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[11px] font-bold tracking-widest uppercase"
          >
            <Plus className="w-4 h-4" />
            Adjust Stock
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Controls */}
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
                className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-full leading-5 bg-white placeholder-charcoal/30 focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy sm:text-sm transition-all shadow-sm"
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

          {/* Table */}
          <div className="bg-white border border-charcoal/10 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/[0.02] border-b border-charcoal/10 text-[10px] font-bold text-charcoal/50 uppercase tracking-widest">
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
                      <tr key={`${stock.variantId}-${stock.locationId}`} className="hover:bg-charcoal/[0.01] transition-colors">
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
                            <div className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-400' : isLowStock ? 'bg-amber-400' : 'bg-emerald-400'}`} title={isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "Healthy"}></div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setAdjustTarget(stock);
                                setAdjustDelta(1);
                                setIsAdjusting(true);
                              }}
                              className="p-1.5 text-charcoal/40 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                              title="Add Stock"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustTarget(stock);
                                setAdjustDelta(-1);
                                setIsAdjusting(true);
                              }}
                              className="p-1.5 text-charcoal/40 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              title="Reduce Stock"
                            >
                              <ArrowDownRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setThresholdTarget(stock);
                                setLowStockThresholdInput(stock.lowStockThreshold || 5);
                                setSafetyStockInput((stock as any).safetyStock || 0);
                                setIsEditingThreshold(true);
                              }}
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
        </div>
      </div>

      {isAdjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/20">
          <div className="bg-white rounded-xl shadow-lg w-[400px] overflow-hidden border border-charcoal/10">
            <div className="px-6 py-4 border-b border-charcoal/10 bg-charcoal/[0.02]">
              <h3 className="font-bold text-charcoal">Adjust Stock Quantity</h3>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const targetVariantId = adjustTarget?.variantId;
                const targetLocationId = adjustTarget?.locationId;
                const targetVariant = targetVariantId ? variantMap[targetVariantId] : null;

                if (targetVariantId && !selectedProductId) {
                  return (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1">Target Variant</label>
                        <div className="px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg text-charcoal font-medium">
                          {targetVariant ? (
                            <div>
                              <div className="font-bold text-sm">{targetVariant.productName}</div>
                              <div className="text-xs text-charcoal/50 font-mono mt-0.5">{targetVariant.sku} {targetVariant.size ? `(${targetVariant.size})` : ""}</div>
                            </div>
                          ) : (
                            <span className="font-mono text-xs">{targetVariantId}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1">Location</label>
                        <div className="px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg text-charcoal font-medium text-sm">
                          {locations.find(l => (l.locationId || l.id) === targetLocationId)?.name || targetLocationId}
                        </div>
                      </div>
                    </>
                  );
                }

                return null;
              })()}
              {(!adjustTarget?.variantId || selectedProductId) && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        setAdjustTarget(prev => ({ ...prev, variantId: "" }));
                      }}
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                    >
                      <option value="">Select a Product</option>
                      {products.map(p => (
                        <option key={p.productId || p.id} value={p.productId || p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Variant *</label>
                    <select
                      value={adjustTarget?.variantId || ""}
                      onChange={(e) => setAdjustTarget((prev) => ({ ...prev, variantId: e.target.value }))}
                      disabled={!selectedProductId && productVariants.length === 0 && !adjustTarget?.variantId}
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy disabled:opacity-50"
                    >
                      <option value="">{adjustTarget?.variantId && !selectedProductId ? adjustTarget.variantId : "Select a Variant"}</option>
                      {productVariants.map(v => (
                        <option key={v.variantId || v.id} value={v.variantId || v.id}>{v.sku} {v.size ? `(${v.size})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Location *</label>
                    <select
                      value={adjustTarget?.locationId || ""}
                      onChange={(e) => setAdjustTarget((prev) => ({ ...prev, locationId: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                    >
                      <option value="">{adjustTarget?.locationId ? adjustTarget.locationId : "Select a Location"}</option>
                      {locations.map(loc => (
                        <option key={loc.locationId || loc.id} value={loc.locationId || loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Delta (+/-) *</label>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Reason *</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
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
                onClick={() => setIsAdjusting(false)}
                className="px-4 py-2 text-xs font-bold text-charcoal/60 hover:text-charcoal transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustSubmit}
                className="px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-xs font-bold tracking-widest uppercase"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreatingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/20">
          <div className="bg-white rounded-xl shadow-lg w-[400px] overflow-hidden border border-charcoal/10">
            <div className="px-6 py-4 border-b border-charcoal/10 bg-charcoal/[0.02]">
              <h3 className="font-bold text-charcoal">Create New Location</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Location Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Main Warehouse"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Type *</label>
                <select
                  value={newLocation.type}
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                >
                  <option value="warehouse">Warehouse</option>
                  <option value="store">Retail Store</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-charcoal/10 bg-charcoal/[0.02] flex justify-end gap-2">
              <button
                onClick={() => setIsCreatingLocation(false)}
                className="px-4 py-2 text-xs font-bold text-charcoal/60 hover:text-charcoal transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLocation}
                className="px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-xs font-bold tracking-widest uppercase"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {isEditingThreshold && thresholdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/20">
          <div className="bg-white rounded-xl shadow-lg w-[400px] overflow-hidden border border-charcoal/10">
            <div className="px-6 py-4 border-b border-charcoal/10 bg-charcoal/[0.02]">
              <h3 className="font-bold text-charcoal">Set Stock Thresholds</h3>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const targetVarId = thresholdTarget.variantId;
                const targetVar = variantMap[targetVarId];
                return (
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1">Variant</label>
                    <div className="px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg text-charcoal font-medium">
                      {targetVar ? (
                        <div>
                          <div className="font-bold text-sm">{targetVar.productName}</div>
                          <div className="text-xs text-charcoal/50 font-mono mt-0.5">{targetVar.sku} {targetVar.size ? `(${targetVar.size})` : ""}</div>
                        </div>
                      ) : (
                        <span className="font-mono text-xs">{targetVarId}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Low Threshold</label>
                  <input
                    type="number"
                    value={lowStockThresholdInput}
                    onChange={(e) => setLowStockThresholdInput(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                  />
                  <p className="text-[9px] text-charcoal/40 mt-1">Triggers yellow status when stock falls to this or lower.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Safety Stock</label>
                  <input
                    type="number"
                    value={safetyStockInput}
                    onChange={(e) => setSafetyStockInput(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                  />
                  <p className="text-[9px] text-charcoal/40 mt-1">Reserve buffer stock count.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-charcoal/[0.02] border-t border-charcoal/10 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditingThreshold(false);
                  setThresholdTarget(null);
                }}
                className="px-4 py-2 border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-colors text-[11px] font-bold tracking-widest uppercase text-charcoal"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveThreshold}
                className="px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[11px] font-bold tracking-widest uppercase"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

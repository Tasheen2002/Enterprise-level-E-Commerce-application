"use client";

import React, { useState, useEffect } from "react";
import { Supplier, PurchaseOrder } from "../../../../features/inventory/types";
import { inventoryApi } from "../../../../features/inventory/api";
import { SupplierTab } from "../../../../features/inventory/components/SupplierTab";
import { PurchaseOrderTab } from "../../../../features/inventory/components/PurchaseOrderTab";
import { CreatePODrawer } from "../../../../features/inventory/components/CreatePODrawer";
import { Truck, RefreshCw, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState<"pos" | "suppliers">("pos");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, { sku: string; size: string; productName: string }>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Drawer toggles
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [selectedSupplierIdForNewPO, setSelectedSupplierIdForNewPO] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [supList, poList, locList, prodList] = await Promise.all([
        inventoryApi.getSuppliers(),
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getLocations(),
        inventoryApi.getProducts()
      ]);

      setSuppliers(supList);
      setPurchaseOrders(poList);
      setLocations(locList);

      if (prodList && prodList.length > 0) {
        const newMap: Record<string, { sku: string; size: string; productName: string }> = {};
        const variantsList: any[] = [];

        // Fetch variants in chunks of 5
        const chunkSize = 5;
        for (let i = 0; i < prodList.length; i += chunkSize) {
          const chunk = prodList.slice(i, i + chunkSize);
          await Promise.all(chunk.map(async (prod) => {
            try {
              const variants = await inventoryApi.getProductVariants(prod.id!);
              if (variants) {
                variants.forEach((v: any) => {
                  const entry = {
                    variantId: v.variantId || v.id,
                    sku: v.sku,
                    size: v.size || "",
                    productName: prod.title || "",
                  };
                  newMap[v.variantId || v.id] = entry;
                  variantsList.push({ ...v, productName: prod.title });
                });
              }
            } catch (err) {
              console.error(`Failed to fetch variants for product ${prod.id}`, err);
            }
          }));
        }

        setVariantMap(newMap);
        setProductVariants(variantsList);
      }
    } catch (err) {
      console.error("Error loading B2B data", err);
      toast.error("Failed to load supply chain metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlaceOrderFromSupplier = (supplierId: string) => {
    setSelectedSupplierIdForNewPO(supplierId);
    setIsCreatingPO(true);
  };

  return (
    <div className="flex flex-col bg-[#FAF9F6] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-charcoal/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal flex items-center gap-2">
            <Truck className="w-5 h-5 text-burgundy" />
            Supply Chain & B2B Operations
          </h1>
          <p className="text-sm text-charcoal/50 mt-1">
            Manage manufacturers, purchase inventory, and receive warehouse shipments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center justify-center p-2 text-charcoal/40 hover:text-charcoal border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-all"
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          
          {activeTab === "pos" && (
            <button
              onClick={() => {
                if (suppliers.length === 0) {
                  toast.error("Please add a supplier profile in the Directory tab first");
                  return;
                }
                setSelectedSupplierIdForNewPO(suppliers[0]?.supplierId || "");
                setIsCreatingPO(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[11px] font-bold tracking-widest uppercase shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Draft Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Elegant Tabs */}
      <div className="px-8 bg-white border-b border-charcoal/10 flex gap-6">
        <button
          onClick={() => { setActiveTab("pos"); setSearchQuery(""); }}
          className={`py-4 text-[11px] font-bold uppercase tracking-[0.2em] relative transition-colors ${activeTab === "pos" ? "text-burgundy" : "text-charcoal/40 hover:text-charcoal"}`}
        >
          Purchase Orders
          {activeTab === "pos" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-burgundy" />}
        </button>
        <button
          onClick={() => { setActiveTab("suppliers"); setSearchQuery(""); }}
          className={`py-4 text-[11px] font-bold uppercase tracking-[0.2em] relative transition-colors ${activeTab === "suppliers" ? "text-burgundy" : "text-charcoal/40 hover:text-charcoal"}`}
        >
          Supplier Directory
          {activeTab === "suppliers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-burgundy" />}
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Global Search and Filter Options */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-charcoal/40" />
              </div>
              <input
                type="text"
                placeholder={activeTab === "pos" ? "Search by PO ID, Supplier..." : "Search by Manufacturer Name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-full leading-5 bg-white placeholder-charcoal/30 focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy sm:text-sm transition-all shadow-sm text-charcoal"
              />
            </div>

            {activeTab === "pos" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-charcoal/50 font-bold uppercase tracking-wider">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-charcoal/10 rounded-full px-3 py-1.5 text-xs font-semibold text-charcoal focus:outline-none focus:ring-1 focus:ring-burgundy shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent (Ordered)</option>
                  <option value="part_received">Part Received</option>
                  <option value="received">Fully Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-charcoal/40 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-burgundy" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading supply chain metrics...</p>
            </div>
          ) : activeTab === "pos" ? (
            <PurchaseOrderTab
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              locations={locations}
              variantMap={variantMap}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onRefresh={fetchData}
            />
          ) : (
            <SupplierTab
              suppliers={suppliers}
              onRefresh={fetchData}
              onPlaceOrder={handlePlaceOrderFromSupplier}
            />
          )}
        </div>
      </div>

      {/* PO CREATE DRAWER */}
      {isCreatingPO && (
        <CreatePODrawer
          suppliers={suppliers}
          productVariants={productVariants}
          variantMap={variantMap}
          initialSupplierId={selectedSupplierIdForNewPO}
          onClose={() => setIsCreatingPO(false)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}

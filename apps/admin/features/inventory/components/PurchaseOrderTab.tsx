import React, { useState } from "react";
import { PurchaseOrder, Supplier, POItem } from "../types";
import { inventoryApi } from "../api";
import { ReceiveStockModal } from "./ReceiveStockModal";
import { FileText, Calendar, ChevronRight, CheckCircle, Boxes, HelpCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrderTabProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  locations: any[];
  variantMap: Record<string, { sku: string; size: string; productName: string }>;
  searchQuery: string;
  statusFilter: string;
  onRefresh: () => void;
}

export function PurchaseOrderTab({
  purchaseOrders,
  suppliers,
  locations,
  variantMap,
  searchQuery,
  statusFilter,
  onRefresh
}: PurchaseOrderTabProps) {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [isReceiving, setIsReceiving] = useState(false);

  const handlePOSelect = async (po: PurchaseOrder) => {
    setSelectedPO(po);
    setPOItems([]);
    try {
      const items = await inventoryApi.getPOItems(po.poId);
      setPOItems(items);
    } catch (e) {
      toast.error("Failed to load PO items");
    }
  };

  const handleUpdateStatus = async (poId: string, status: "sent" | "cancelled") => {
    try {
      const updatedPO = await inventoryApi.updatePOStatus(poId, status);
      toast.success(`Purchase Order status updated to ${status}`);
      if (selectedPO?.poId === poId) {
        setSelectedPO(updatedPO);
      }
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const handleRefreshPOAfterReceival = async (updatedPO: PurchaseOrder) => {
    setSelectedPO(updatedPO);
    const items = await inventoryApi.getPOItems(updatedPO.poId);
    setPOItems(items);
    onRefresh();
  };

  // Filter purchase orders
  const filteredPOList = purchaseOrders.filter(po => {
    const supplier = suppliers.find(s => s.supplierId === po.supplierId);
    const supplierName = supplier?.name?.toLowerCase() || "";
    const poIdLower = po.poId.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = poIdLower.includes(searchLower) || supplierName.includes(searchLower);
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Table grid of POs */}
      <div className="bg-white border border-charcoal/10 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-charcoal/[0.02] border-b border-charcoal/10 text-[10px] font-bold text-charcoal/50 uppercase tracking-widest">
              <th className="py-4 px-6 font-medium">Order UUID / Created</th>
              <th className="py-4 px-6 font-medium">B2B Supplier</th>
              <th className="py-4 px-6 font-medium">ETA Arrival Date</th>
              <th className="py-4 px-6 font-medium text-center">Status</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/5 text-sm text-charcoal/80">
            {filteredPOList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-charcoal/60">
                  No purchase orders matching filters found.
                </td>
              </tr>
            ) : (
              filteredPOList.map((po) => {
                const supplier = suppliers.find(s => s.supplierId === po.supplierId);
                
                // Status badge logic
                let badgeBg = "bg-stone-100 text-stone-700";
                if (po.status === "sent") badgeBg = "bg-sky-50 text-sky-700 border border-sky-200/50";
                else if (po.status === "part_received") badgeBg = "bg-amber-50 text-amber-700 border border-amber-200/50";
                else if (po.status === "received") badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
                else if (po.status === "cancelled") badgeBg = "bg-red-50 text-red-600/80 border border-red-200/30";

                return (
                  <tr 
                    key={po.poId} 
                    className="hover:bg-charcoal/[0.01] transition-colors cursor-pointer"
                    onClick={() => handlePOSelect(po)}
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold font-mono text-[11px] text-charcoal flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-charcoal/40" />
                        {po.poId.substring(0, 8)}...
                      </div>
                      <div className="text-[10px] text-charcoal/40 mt-1">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-charcoal">
                      {supplier ? supplier.name : <span className="text-xs font-mono text-charcoal/40">Unknown</span>}
                    </td>
                    <td className="py-4 px-6 text-charcoal/60">
                      {po.eta ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-charcoal/30" />
                          {new Date(po.eta).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-charcoal/30 font-medium italic">No date set</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                        {po.status === "part_received" ? "part received" : po.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handlePOSelect(po)}
                        className="text-xs font-bold text-burgundy hover:text-charcoal tracking-wide uppercase transition-colors"
                      >
                        Manage Order
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW PO DETAILS DRAWER */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-charcoal/20">
          <div className="bg-white w-[640px] h-screen shadow-2xl border-l border-charcoal/10 flex flex-col justify-between">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-charcoal/10 flex items-center justify-between bg-charcoal/[0.02]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-2">
                    <FileText className="w-5 h-5 text-burgundy" />
                    Purchase Order Details
                  </h3>
                  <p className="text-[10px] text-charcoal/40 font-mono mt-0.5">ID: {selectedPO.poId}</p>
                </div>
                <button onClick={() => setSelectedPO(null)} className="text-charcoal/40 hover:text-charcoal font-bold text-xl leading-none">×</button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Supplier & Status Info Card */}
                <div className="grid grid-cols-2 gap-6 bg-[#FAF9F6] border border-charcoal/10 rounded-xl p-5 text-xs">
                  <div>
                    <h4 className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest mb-1.5">Supplier Partner</h4>
                    <p className="font-serif font-bold text-charcoal text-sm">
                      {suppliers.find(s => s.supplierId === selectedPO.supplierId)?.name || "Unknown"}
                    </p>
                    <div className="text-charcoal/60 space-y-1 mt-2">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-charcoal/30" /> Created: {new Date(selectedPO.createdAt).toLocaleString()}</div>
                      {selectedPO.eta && (
                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-burgundy" /> Delivery: {new Date(selectedPO.eta).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end text-right">
                    <div>
                      <h4 className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest mb-1.5">Order Status</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedPO.status === "received" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                        selectedPO.status === "sent" ? "bg-sky-50 text-sky-700 border border-sky-200/50" :
                        selectedPO.status === "part_received" ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                        selectedPO.status === "cancelled" ? "bg-red-50 text-red-600/80 border border-red-200/30" :
                        "bg-stone-100 text-stone-700"
                      }`}>
                        {selectedPO.status === "part_received" ? "part received" : selectedPO.status}
                      </span>
                    </div>

                    {/* Workflow status triggers */}
                    {selectedPO.status === "draft" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedPO.poId, "cancelled")}
                          className="px-3 py-1.5 border border-red-200 text-red-600/70 hover:text-red-600 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedPO.poId, "sent")}
                          className="px-3 py-1.5 bg-burgundy hover:bg-charcoal text-white rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Mark Sent (Order)
                        </button>
                      </div>
                    )}

                    {selectedPO.status === "sent" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(selectedPO.poId, "cancelled")}
                          className="px-3 py-1.5 border border-red-200 text-red-600/70 hover:text-red-600 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Cancel Order
                        </button>
                        <button
                          onClick={() => setIsReceiving(true)}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Receive Stock
                        </button>
                      </div>
                    )}

                    {selectedPO.status === "part_received" && (
                      <button
                        onClick={() => setIsReceiving(true)}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <PackageCheck className="w-3.5 h-3.5" /> Receive Balance
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50">Expected Quantities List</h4>
                  
                  <div className="border border-charcoal/10 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-charcoal/[0.01] border-b border-charcoal/10 text-[9px] font-bold text-charcoal/50 uppercase tracking-widest">
                          <th className="py-3 px-5">Variant SKU & Title</th>
                          <th className="py-3 px-4 text-right">Ordered</th>
                          <th className="py-3 px-4 text-right">Received</th>
                          <th className="py-3 px-4 text-right">Remaining</th>
                          <th className="py-3 px-5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-charcoal/5 text-charcoal">
                        {poItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-charcoal/40 italic">Retrieving order line item states...</td>
                          </tr>
                        ) : (
                          poItems.map(item => {
                            const entry = variantMap[item.variantId];
                            return (
                              <tr key={item.variantId} className="hover:bg-charcoal/[0.005]">
                                <td className="py-4 px-5 font-semibold">
                                  {entry ? (
                                    <div>
                                      <div>{entry.productName}</div>
                                      <div className="text-[10px] text-charcoal/40 font-mono mt-0.5">SKU: {entry.sku} {entry.size ? `(${entry.size})` : ""}</div>
                                    </div>
                                  ) : (
                                    <span className="font-mono text-[10px]">{item.variantId}</span>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-right font-bold text-charcoal/80">{item.orderedQty}</td>
                                <td className="py-4 px-4 text-right text-emerald-600 font-bold">{item.receivedQty}</td>
                                <td className="py-4 px-4 text-right font-bold text-charcoal/60">{item.remainingQty}</td>
                                <td className="py-4 px-5 text-center">
                                  <div className="flex justify-center">
                                    {item.isFullyReceived ? (
                                      <span title="Fully Received"><CheckCircle className="w-4 h-4 text-emerald-500" /></span>
                                    ) : item.isPartiallyReceived ? (
                                      <span title="Partially Received"><Boxes className="w-4 h-4 text-amber-500" /></span>
                                    ) : (
                                      <span title="Not Received"><HelpCircle className="w-4 h-4 text-stone-300" /></span>
                                    )}
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
            </div>

            <div className="px-8 py-6 border-t border-charcoal/10 bg-charcoal/[0.02] flex justify-end">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-6 py-2.5 bg-charcoal text-white rounded-full hover:bg-burgundy text-xs font-bold tracking-widest uppercase transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE STOCK SHIPMENT MODAL */}
      {isReceiving && selectedPO && (
        <ReceiveStockModal
          purchaseOrder={selectedPO}
          poItems={poItems}
          locations={locations}
          variantMap={variantMap}
          onClose={() => setIsReceiving(false)}
          onRefreshPO={handleRefreshPOAfterReceival}
        />
      )}
    </div>
  );
}

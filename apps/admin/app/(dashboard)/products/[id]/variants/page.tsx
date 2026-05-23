"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, unwrap } from "../../../../../lib/api-client";
import { ArrowLeft, Plus, Edit2, Trash2, Box, Save, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Variant {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  barcode?: string | null;
  weightG?: number | null;
  allowBackorder: boolean;
  allowPreorder: boolean;
  createdAt: string;
}

export default function VariantsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productTitle, setProductTitle] = useState("Loading...");

  const [isEditing, setIsEditing] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<Partial<Variant> | null>(null);

  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      // Fetch Product Details to get the title
      const pRes = await api.GET("/api/v1/products/{productId}", {
        params: { path: { productId } },
      });
      if (pRes.data?.success && pRes.data.data.title) {
        setProductTitle(pRes.data.data.title);
      }

      // Fetch Variants
      const vRes = await api.GET("/api/v1/products/{productId}/variants", {
        params: { 
          path: { productId },
          query: { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }
        },
      });
      
      // Handle the envelope structure
      if (vRes.data?.success && vRes.data.data && 'items' in vRes.data.data) {
        const sortedItems = [...(vRes.data.data.items as any[])].sort((a, b) => {
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
        setVariants(sortedItems);
      } else {
        setVariants([]);
      }
    } catch (err) {
      toast.error("Failed to load variants");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  const handleAddNew = () => {
    setCurrentVariant({
      sku: "",
      size: "",
      color: "",
      barcode: "",
      allowBackorder: false,
      allowPreorder: false,
    });
    setIsEditing(true);
  };

  const handleEdit = (variant: Variant) => {
    setCurrentVariant({ ...variant });
    setIsEditing(true);
  };

  const handleDelete = (variantId: string) => {
    toast.error("Are you sure you want to delete this variant?", {
      description: "This will permanently remove this variant from the catalog.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await api.DELETE("/api/v1/variants/{variantId}", {
              params: { path: { variantId } },
            });
            if (res.error) throw new Error("Delete failed");
            toast.success("Variant deleted successfully");
            fetchVariants();
          } catch (err) {
            toast.error("Failed to delete variant");
          }
        },
      },
    });
  };

  const handleSave = async () => {
    if (!currentVariant?.sku) {
      toast.error("SKU is required");
      return;
    }

    try {
      if (currentVariant.id) {
        // Update
        const res = await api.PATCH("/api/v1/variants/{variantId}", {
          params: { path: { variantId: currentVariant.id } },
          body: {
            sku: currentVariant.sku,
            size: currentVariant.size || undefined,
            color: currentVariant.color || undefined,
            barcode: currentVariant.barcode || undefined,
            allowBackorder: currentVariant.allowBackorder,
            allowPreorder: currentVariant.allowPreorder,
          },
        });
        if (res.error) throw new Error("Update failed");
        toast.success("Variant updated");
      } else {
        // Create
        const res = await api.POST("/api/v1/products/{productId}/variants", {
          params: { path: { productId } },
          body: {
            sku: currentVariant.sku,
            size: currentVariant.size || undefined,
            color: currentVariant.color || undefined,
            barcode: currentVariant.barcode || undefined,
            allowBackorder: currentVariant.allowBackorder || false,
            allowPreorder: currentVariant.allowPreorder || false,
          },
        });
        if (res.error) throw new Error("Create failed");
        toast.success("Variant created");
      }
      setIsEditing(false);
      setCurrentVariant(null);
      fetchVariants();
    } catch (err) {
      toast.error("Failed to save variant");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6]">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-charcoal/10">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 -ml-2 text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-charcoal flex items-center gap-2">
              <Box className="w-5 h-5 text-burgundy" />
              Manage Variants
            </h1>
            <p className="text-sm text-charcoal/50 mt-1">
              {productTitle} • {variants.length} Variants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchVariants}
            className="flex items-center justify-center p-2 text-charcoal/40 hover:text-charcoal border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {!isEditing && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[11px] font-bold tracking-widest uppercase"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {isEditing ? (
          <div className="max-w-2xl bg-white border border-charcoal/10 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-charcoal/10 flex items-center justify-between bg-charcoal/[0.02]">
              <h2 className="font-bold text-charcoal">
                {currentVariant?.id ? "Edit Variant" : "New Variant"}
              </h2>
              <button onClick={() => setIsEditing(false)} className="text-charcoal/40 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">SKU *</label>
                  <input
                    type="text"
                    value={currentVariant?.sku || ""}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, sku: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all"
                    placeholder="e.g. PIPER-MOC-38"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">Barcode</label>
                  <input
                    type="text"
                    value={currentVariant?.barcode || ""}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, barcode: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all"
                    placeholder="UPC / EAN"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">Size</label>
                  <input
                    type="text"
                    value={currentVariant?.size || ""}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, size: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all"
                    placeholder="e.g. 38, M, L"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">Color</label>
                  <input
                    type="text"
                    value={currentVariant?.color || ""}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, color: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all"
                    placeholder="e.g. Mocha Dot"
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-4 border-t border-charcoal/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentVariant?.allowBackorder || false}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, allowBackorder: e.target.checked })}
                    className="rounded border-charcoal/20 text-burgundy focus:ring-burgundy"
                  />
                  <span className="text-sm font-medium text-charcoal/80">Allow Backorder</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentVariant?.allowPreorder || false}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, allowPreorder: e.target.checked })}
                    className="rounded border-charcoal/20 text-burgundy focus:ring-burgundy"
                  />
                  <span className="text-sm font-medium text-charcoal/80">Allow Preorder</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 text-sm font-medium text-charcoal/60 hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-burgundy text-white text-sm font-medium rounded-full hover:bg-charcoal transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Variant
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-charcoal/10 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/[0.02] border-b border-charcoal/10 text-[10px] font-bold text-charcoal/50 uppercase tracking-widest">
                  <th className="py-4 px-6 font-medium">SKU</th>
                  <th className="py-4 px-6 font-medium">Size</th>
                  <th className="py-4 px-6 font-medium">Color</th>
                  <th className="py-4 px-6 font-medium">Settings</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5 text-sm text-charcoal/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-charcoal/40">Loading variants...</td>
                  </tr>
                ) : variants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <p className="text-charcoal/60 mb-4">No variants found for this product.</p>
                      <button
                        onClick={handleAddNew}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal/5 text-charcoal rounded-full hover:bg-charcoal/10 transition-colors text-[11px] font-bold tracking-widest uppercase"
                      >
                        <Plus className="w-4 h-4" />
                        Create First Variant
                      </button>
                    </td>
                  </tr>
                ) : (
                  variants.map((v) => (
                    <tr key={v.id} className="hover:bg-charcoal/[0.01] transition-colors">
                      <td className="py-4 px-6 font-mono text-[12px] font-bold">{v.sku}</td>
                      <td className="py-4 px-6">{v.size || "—"}</td>
                      <td className="py-4 px-6">{v.color || "—"}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 text-[10px]">
                          {v.allowBackorder && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Backorder</span>}
                          {v.allowPreorder && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Preorder</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(v)}
                            className="p-1.5 text-charcoal/40 hover:text-burgundy rounded hover:bg-burgundy/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-1.5 text-charcoal/40 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

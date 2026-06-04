"use client";

import React from "react";
import { Edit2, Trash2, Plus, Box } from "lucide-react";
import { Variant } from "../types";

interface VariantTableProps {
  variants: Variant[];
  isLoading: boolean;
  onEdit: (variant: Variant) => void;
  onDelete: (variantId: string) => void;
  onAddNew: () => void;
}

export function VariantTable({
  variants,
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}: VariantTableProps) {
  return (
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
              <td colSpan={5} className="py-12 text-center text-charcoal/40">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-charcoal/10 border-t-burgundy rounded-full animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Loading variants...</p>
                </div>
              </td>
            </tr>
          ) : variants.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-charcoal/[0.02] border border-charcoal/5 flex items-center justify-center text-charcoal/30">
                    <Box className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-[12px] font-bold uppercase tracking-widest text-charcoal/60">No Variants Commissioned</h4>
                  <p className="text-[10px] text-charcoal/40 max-w-[280px] leading-relaxed mb-2">
                    No custom size or color variants found for this product.
                  </p>
                  <button
                    onClick={onAddNew}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-[10px] font-bold tracking-widest uppercase shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Variant
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            variants.map((v) => (
              <tr key={v.id} className="hover:bg-charcoal/[0.005] transition-colors">
                <td className="py-4 px-6 font-mono text-[12px] font-bold text-charcoal">{v.sku}</td>
                <td className="py-4 px-6">{v.size || "—"}</td>
                <td className="py-4 px-6">{v.color || "—"}</td>
                <td className="py-4 px-6">
                  <div className="flex gap-2 text-[10px] font-semibold">
                    {v.allowBackorder && (
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider text-[9px]">
                        Backorder
                      </span>
                    )}
                    {v.allowPreorder && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider text-[9px]">
                        Preorder
                      </span>
                    )}
                    {!v.allowBackorder && !v.allowPreorder && (
                      <span className="text-charcoal/30 text-[10px] italic">Standard</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(v)}
                      className="p-2 border border-charcoal/10 hover:border-charcoal/30 bg-white hover:bg-[#EBE6D9]/20 text-charcoal/60 hover:text-burgundy rounded-full transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      className="p-2 border border-red-100 hover:border-red-200 bg-white hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

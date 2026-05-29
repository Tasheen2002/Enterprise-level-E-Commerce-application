"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Variant } from "../types";

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: Partial<Variant> | null;
  onSave: (variantData: Partial<Variant>) => Promise<void>;
}

export function VariantModal({
  isOpen,
  onClose,
  variant,
  onSave,
}: VariantModalProps) {
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [allowPreorder, setAllowPreorder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (variant) {
      setSku(variant.sku || "");
      setBarcode(variant.barcode || "");
      setSize(variant.size || "");
      setColor(variant.color || "");
      setAllowBackorder(variant.allowBackorder || false);
      setAllowPreorder(variant.allowPreorder || false);
    } else {
      setSku("");
      setBarcode("");
      setSize("");
      setColor("");
      setAllowBackorder(false);
      setAllowPreorder(false);
    }
  }, [variant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: variant?.id,
        sku: sku.trim(),
        barcode: barcode.trim() || null,
        size: size.trim() || null,
        color: color.trim() || null,
        allowBackorder,
        allowPreorder,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-xs animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-[#FAF9F6] border border-charcoal/10 rounded-xl overflow-hidden shadow-2xl w-full max-w-lg mx-4 flex flex-col z-10 text-charcoal animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-charcoal/10 flex items-center justify-between bg-charcoal/[0.02]">
          <h2 className="font-serif font-bold text-charcoal">
            {variant?.id ? "Edit Physical Variant" : "Add Physical Variant"}
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full border border-charcoal/10 flex items-center justify-center text-charcoal/40 hover:text-charcoal transition-all hover:bg-charcoal/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">SKU *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all text-xs font-semibold"
                placeholder="e.g. PIPER-MOC-38"
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all text-xs font-semibold"
                placeholder="UPC / EAN"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all text-xs font-semibold"
                placeholder="e.g. 38, 39, M, L"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-2">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all text-xs font-semibold"
                placeholder="e.g. Mocha Dot"
              />
            </div>
          </div>

          <div className="flex gap-6 pt-4 border-t border-charcoal/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowBackorder}
                onChange={(e) => setAllowBackorder(e.target.checked)}
                className="rounded border-charcoal/20 text-burgundy focus:ring-burgundy"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Allow Backorder</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPreorder}
                onChange={(e) => setAllowPreorder(e.target.checked)}
                className="rounded border-charcoal/20 text-burgundy focus:ring-burgundy"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Allow Preorder</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !sku.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-charcoal text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-burgundy transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Variant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

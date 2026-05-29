import React, { useState } from "react";
import { inventoryApi } from "../api";
import { toast } from "sonner";

interface CreateLocationModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export function CreateLocationModal({ onClose, onRefresh }: CreateLocationModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"warehouse" | "store" | "vendor">("warehouse");

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Location name is required");
      return;
    }
    try {
      await inventoryApi.createLocation(name.trim(), type);
      toast.success("Location registered successfully");
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create location");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal/60 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-lg w-[400px] overflow-hidden border border-charcoal/10">
        <div className="px-6 py-4 border-b border-charcoal/10 bg-charcoal/[0.02]">
          <h3 className="font-bold text-charcoal">Create New Location</h3>
        </div>
        
        <div className="p-6 space-y-4 text-charcoal">
          <div>
            <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Location Name *</label>
            <input
              type="text"
              placeholder="e.g. Main Warehouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-semibold text-charcoal"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-charcoal/10 rounded-lg focus:outline-none focus:border-burgundy text-xs font-semibold text-charcoal"
            >
              <option value="warehouse">Warehouse</option>
              <option value="store">Retail Store</option>
              <option value="vendor">Vendor</option>
            </select>
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
            className="px-4 py-2 bg-charcoal text-white rounded-full hover:bg-burgundy transition-colors text-xs font-bold tracking-widest uppercase"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

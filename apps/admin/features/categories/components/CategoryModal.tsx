import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { Category } from "../types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: Category | null;
  categories: Category[];
  onSave: (payload: {
    name: string;
    slug: string;
    parentId: string;
    position: number;
  }) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  categories,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
    position: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Sync state with selectedCategory on open
  useEffect(() => {
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        parentId: selectedCategory.parentId || "",
        position: selectedCategory.position || 0,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        parentId: "",
        position: categories.length + 1,
      });
    }
  }, [selectedCategory, isOpen, categories.length]);

  if (!isOpen) return null;

  // Slug auto-generation on Name change helper
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameVal = e.target.value;
    const isNew = !selectedCategory;

    setFormData((prev) => {
      const newSlug = isNew
        ? nameVal
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        : prev.slug;
      return {
        ...prev,
        name: nameVal,
        slug: newSlug,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/60 transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Modal Body */}
      <div className="relative w-full max-w-[540px] max-h-[85vh] bg-[#F5F1E8] shadow-2xl flex flex-col z-10 border border-charcoal/5 rounded-2xl animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-charcoal/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif text-charcoal">
              {selectedCategory ? "Edit Category Details" : "Create Boutique Category"}
            </h2>
            <p className="text-[9px] font-bold text-charcoal/40 uppercase tracking-widest mt-0.5">
              {selectedCategory ? `ID: ${selectedCategory.id}` : "Boutique Category Registration"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-charcoal/10 flex items-center justify-center text-charcoal/40 hover:text-charcoal transition-all hover:bg-charcoal/5"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Form content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-6 no-scrollbar">
          {/* Identity Card */}
          <div className="bg-white border border-charcoal/5 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Category Identity</h3>

            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Heeled Sandals"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">URL Slug</label>
              <input
                type="text"
                required
                placeholder="heeled-sandals"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, ""),
                  })
                }
                className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors font-mono"
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Parent Category</label>
              <select
                value={formData.parentId}
                onChange={(e) =>
                  setFormData({ ...formData, parentId: e.target.value })
                }
                className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
              >
                <option value="">None (Root Category)</option>
                {categories
                  .filter((c) => !selectedCategory || c.id !== selectedCategory.id) // Prevent self-parenting cycles
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Position rank */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-widest text-charcoal/60 font-bold block">Display Position (Rank)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="0"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: Number(e.target.value) })
                }
                className="w-full bg-[#F9F8F4] border-0 border-b border-charcoal/10 pl-3 pr-3 py-2.5 text-[12px] font-medium text-charcoal focus:outline-none focus:border-burgundy transition-colors"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-charcoal/5 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-charcoal/40 font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-charcoal/30" />
            <span>Audit log ready</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-charcoal/20 px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/5 transition-colors rounded-full"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-charcoal text-cream px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-burgundy transition-all duration-500 rounded-full shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {submitting ? "Saving..." : selectedCategory ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

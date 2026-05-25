import React, { useState, useEffect } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Solid Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-charcoal/60 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#FCFBF8] border border-charcoal/10 rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Modal Header */}
        <div className="bg-[#FBF9F5] border-b border-charcoal/10 px-8 py-5 flex justify-between items-center">
          <div>
            <h3 className="text-base font-serif italic text-charcoal">
              {selectedCategory ? "Edit Category Details" : "Create Boutique Category"}
            </h3>
            <p className="text-[9px] uppercase tracking-[0.2em] text-charcoal/40 font-bold mt-0.5">
              {selectedCategory
                ? `ID: ${selectedCategory.id}`
                : "ADD NEW TAXONOMY COLLECTION"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal/40 hover:text-charcoal text-lg font-light leading-none p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-[0.2em] font-bold text-charcoal/60">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Heeled Sandals"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full bg-[#F9F8F4] border border-charcoal/10 rounded-sm px-4 py-3 text-xs text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal/30 transition-all"
              required
            />
          </div>

          {/* Slug mapping */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-[0.2em] font-bold text-charcoal/60">
              URL Slug
            </label>
            <input
              type="text"
              placeholder="e.g. heeled-sandals"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, ""),
                })
              }
              className="w-full bg-[#F9F8F4] border border-charcoal/10 rounded-sm px-4 py-3 text-xs text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal/30 transition-all font-mono"
              required
            />
          </div>

          {/* Parent dropdown */}
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-[0.2em] font-bold text-charcoal/60">
              Parent Category
            </label>
            <select
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
              className="w-full bg-[#F9F8F4] border border-charcoal/10 rounded-sm px-4 py-3 text-xs text-charcoal focus:outline-none focus:border-charcoal/30 transition-all"
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
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-[0.2em] font-bold text-charcoal/60">
              Display Position (Rank)
            </label>
            <input
              type="number"
              placeholder="0"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: Number(e.target.value) })
              }
              className="w-full bg-[#F9F8F4] border border-charcoal/10 rounded-sm px-4 py-3 text-xs text-charcoal focus:outline-none focus:border-charcoal/30 transition-all"
              min="0"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/5">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal/40 hover:text-charcoal transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-burgundy hover:bg-burgundy/90 text-[#F5F1E8] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-lg shadow-burgundy/5 transition-all hover:-translate-y-0.5 active:scale-95 duration-300 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : selectedCategory
                ? "Save Changes"
                : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

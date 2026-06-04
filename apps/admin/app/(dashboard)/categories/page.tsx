"use client";

import React, { useState } from "react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { useAdminCategories } from "../../../features/categories/hooks/useAdminCategories";
import { Category } from "../../../features/categories/types";
import { CategoryTreeView } from "../../../features/categories/components/CategoryTreeView";
import { CategoryModal } from "../../../features/categories/components/CategoryModal";
import { Search, RotateCcw } from "lucide-react";

export default function CategoriesPage() {
  const { categories, loading, refetch, saveCategory, deleteCategory } = useAdminCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async (formData: { name: string; slug: string; parentId: string; position: number }) => {
    await saveCategory(selectedCategory, formData);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-serif tracking-wide text-charcoal">Boutique Categories</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-charcoal/50 mt-1 font-bold">
            Manage e-commerce hierarchical collections & taxonomy
          </p>
        </div>
        <button
          onClick={() => { setSelectedCategory(null); setModalOpen(true); }}
          className="px-6 py-3 bg-charcoal hover:bg-burgundy text-[#F5F1E8] text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-md hover:shadow-lg transition-all duration-500"
        >
          + Add Category
        </button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal/30">
            <Search className="w-[14px] h-[14px]" strokeWidth={1.5} />
          </span>
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-charcoal/10 rounded-full text-xs text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal/30 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={refetch}
          className="px-4 py-3 border border-charcoal/10 hover:border-charcoal/20 bg-[#FCFBF8] hover:bg-[#F9F8F4] transition-all flex items-center justify-center gap-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal/60 active:scale-95"
        >
          <RotateCcw className="w-[12px] h-[12px]" strokeWidth={1.5} />
          Reload List
        </button>
      </div>

      <div className="bg-white border border-charcoal/5 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-charcoal/10 border-t-burgundy animate-spin rounded-full mb-3" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/40 font-semibold">Loading Boutique Catalog...</p>
          </div>
        ) : (
          <CategoryTreeView
            categories={categories}
            searchQuery={searchQuery}
            onEdit={(cat) => { setSelectedCategory(cat); setModalOpen(true); }}
            onDelete={setDeleteId}
          />
        )}
      </div>

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedCategory={selectedCategory}
        categories={categories}
        onSave={handleSave}
      />

      {deleteId && (
        <ConfirmModal
          title="Delete Boutique Category?"
          message="Are you sure you want to permanently delete this category? Products mapped to this category may display as uncategorized until re-mapped."
          confirmLabel="Delete Category"
          cancelLabel="Keep Category"
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}

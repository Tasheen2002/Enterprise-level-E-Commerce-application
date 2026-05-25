"use client";

import React, { useState, useEffect } from "react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { categoriesApi } from "../../../features/categories/api";
import { Category } from "../../../features/categories/types";
import { CategoryTreeView } from "../../../features/categories/components/CategoryTreeView";
import { CategoryModal } from "../../../features/categories/components/CategoryModal";
import { toast } from "sonner";
import { Search, RotateCcw } from "lucide-react";

const MOCK_CATEGORIES: Category[] = [
  { id: "shoes-category-id", name: "Shoes", slug: "shoes", parentId: null, position: 1 },
  { id: "heeled-sandals-id", name: "Heeled Sandals", slug: "heeled-sandals", parentId: "shoes-category-id", position: 2 },
  { id: "bags-category-id", name: "Bags", slug: "bags", parentId: null, position: 3 },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data.length > 0 ? data : MOCK_CATEGORIES);
    } catch (err) {
      console.warn("Backend categories unavailable, using fallback mock state.", err);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (formData: { name: string; slug: string; parentId: string; position: number }) => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        parentId: formData.parentId || undefined,
        position: Number(formData.position),
      };

      if (selectedCategory) {
        await categoriesApi.updateCategory(selectedCategory.id, {
          ...payload,
          parentId: formData.parentId || null,
        });
        toast.success("Category updated successfully");
      } else {
        await categoriesApi.createCategory(payload);
        toast.success("Category created successfully");
      }
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save category");
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await categoriesApi.deleteCategory(deleteId);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete category");
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
          className="px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-[#F5F1E8] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-burgundy/10 transition-all hover:-translate-y-0.5 active:scale-95 duration-300"
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
            className="w-full pl-10 pr-4 py-3 bg-[#FCFBF8] border border-charcoal/10 rounded-sm text-xs text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal/30 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={fetchCategories}
          className="px-4 py-3 border border-charcoal/10 hover:border-charcoal/20 bg-[#FCFBF8] hover:bg-[#F9F8F4] transition-all flex items-center justify-center gap-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal/60 active:scale-95"
        >
          <RotateCcw className="w-[12px] h-[12px]" strokeWidth={1.5} />
          Reload List
        </button>
      </div>

      <div className="bg-[#FCFBF8] border border-charcoal/10 rounded-sm overflow-hidden shadow-sm">
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

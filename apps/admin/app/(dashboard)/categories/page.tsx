"use client";

import React, { useState, useEffect } from "react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { api, unwrap } from "../../../lib/api-client";
import { toast } from "sonner";
import { Edit, Trash2, Search, ArrowRight, CornerDownRight, RotateCcw } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  position?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: "shoes-category-id",
    name: "Shoes",
    slug: "shoes",
    parentId: null,
    position: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "heeled-sandals-id",
    name: "Heeled Sandals",
    slug: "heeled-sandals",
    parentId: "shoes-category-id",
    position: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bags-category-id",
    name: "Bags",
    slug: "bags",
    parentId: null,
    position: 3,
    createdAt: new Date().toISOString(),
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    parentId: string;
    position: number;
  }>({
    name: "",
    slug: "",
    parentId: "",
    position: 0,
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch Categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.GET("/api/v1/categories", {
        params: {
          query: {
            page: 1,
            limit: 100,
            sortBy: "position",
            sortOrder: "asc",
            includeChildren: true,
          },
        },
      });

      if (error) {
        console.warn("Backend categories unavailable, falling back to mock state.", error);
        setCategories(MOCK_CATEGORIES);
        return;
      }

      const res = unwrap(data) as any;
      if (res && res.items) {
        setCategories(res.items);
      } else {
        setCategories(MOCK_CATEGORIES);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Slug auto-generation helper
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameVal = e.target.value;
    const isNew = !selectedCategory;
    
    setFormData((prev) => {
      const newSlug = isNew 
        ? nameVal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : prev.slug;
      return {
        ...prev,
        name: nameVal,
        slug: newSlug,
      };
    });
  };

  const handleCreateClick = () => {
    setSelectedCategory(null);
    setFormData({
      name: "",
      slug: "",
      parentId: "",
      position: categories.length + 1,
    });
    setDrawerOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || "",
      position: category.position || 0,
    });
    setDrawerOpen(true);
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (selectedCategory) {
        // UPDATE MODE
        const payload = {
          name: formData.name.trim(),
          slug: formData.slug.trim() || undefined,
          parentId: formData.parentId || null,
          position: Number(formData.position),
        };
        const { data, error } = await api.PATCH("/api/v1/categories/{id}", {
          params: { path: { id: selectedCategory.id } },
          body: payload,
        });
        if (error) throw error;
        unwrap(data);
        toast.success("Category updated successfully");
      } else {
        // CREATE MODE
        const payload = {
          name: formData.name.trim(),
          slug: formData.slug.trim() || undefined,
          parentId: formData.parentId || undefined,
          position: Number(formData.position),
        };
        const { data, error } = await api.POST("/api/v1/categories", {
          body: payload,
        });
        if (error) throw error;
        unwrap(data);
        toast.success("Category created successfully");
      }
      setDrawerOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save category");
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const { data, error } = await api.DELETE("/api/v1/categories/{id}", {
        params: { path: { id: deleteId } },
      });
      if (error) throw error;
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete category");
    } finally {
      setDeleteId(null);
    }
  };

  // Helper to map parent name
  const getParentName = (parentId: string | null | undefined) => {
    if (!parentId) return "-";
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "-";
  };

  // Filter categories
  const filteredCategories = categories.filter((c) => {
    const term = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[26px] font-serif tracking-wide text-charcoal">
            Boutique Categories
          </h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-charcoal/50 mt-1 font-bold">
            Manage e-commerce hierarchical collections & taxonomy
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-[#F5F1E8] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-xl shadow-burgundy/10 transition-all hover:-translate-y-0.5 active:scale-95 duration-300"
        >
          + Add Category
        </button>
      </div>

      {/* Controls Bar */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search */}
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

        {/* Reload */}
        <button
          onClick={fetchCategories}
          className="px-4 py-3 border border-charcoal/10 hover:border-charcoal/20 bg-[#FCFBF8] hover:bg-[#F9F8F4] transition-all flex items-center justify-center gap-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal/60 active:scale-95"
        >
          <RotateCcw className="w-[12px] h-[12px]" strokeWidth={1.5} />
          Reload List
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-[#FCFBF8] border border-charcoal/10 rounded-sm overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-charcoal/10 border-t-burgundy animate-spin rounded-full mb-3" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/40 font-semibold">
              Loading Boutique Catalog...
            </p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm font-serif italic text-charcoal/50 mb-1">
              No categories found
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-charcoal/30">
              Try adjusting your query or create a new collection category
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-charcoal/10 bg-[#FBF9F5] text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/60">
                  <th className="py-4 px-6 font-semibold">Position</th>
                  <th className="py-4 px-6 font-semibold">Category Name</th>
                  <th className="py-4 px-6 font-semibold">Slug Mapping</th>
                  <th className="py-4 px-6 font-semibold">Parent Line</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5 text-xs text-charcoal/80">
                {filteredCategories.map((cat) => {
                  const isChild = !!cat.parentId;
                  return (
                    <tr 
                      key={cat.id} 
                      className="hover:bg-[#F9F8F4]/50 transition-colors duration-200"
                    >
                      <td className="py-4.5 px-6 font-mono text-[10px] text-charcoal/40">
                        {cat.position !== undefined && cat.position !== null ? cat.position : 0}
                      </td>
                      <td className="py-4.5 px-6 font-serif">
                        <div className="flex items-center gap-2">
                          {isChild && (
                            <CornerDownRight className="w-3.5 h-3.5 text-charcoal/30 shrink-0" />
                          )}
                          <span className={`${isChild ? "text-charcoal/70" : "font-semibold text-charcoal text-sm"}`}>
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="font-mono text-[10px] bg-charcoal/5 px-2 py-0.5 rounded-full text-charcoal/60">
                          {cat.slug}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-charcoal/60 font-serif italic">
                        {getParentName(cat.parentId)}
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(cat)}
                            className="p-2 border border-charcoal/10 hover:border-charcoal hover:bg-white text-charcoal/50 hover:text-charcoal transition-all rounded-sm active:scale-90"
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => setDeleteId(cat.id)}
                            className="p-2 border border-charcoal/10 hover:border-red-600 hover:bg-red-50 text-charcoal/50 hover:text-red-600 transition-all rounded-sm active:scale-90"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Drawer (Centered Modal Pattern) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Solid Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-charcoal/60 transition-opacity" 
            onClick={() => setDrawerOpen(false)}
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
                  {selectedCategory ? `ID: ${selectedCategory.id}` : "ADD NEW TAXONOMY COLLECTION"}
                </p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="text-charcoal/40 hover:text-charcoal text-lg font-light leading-none p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-8 space-y-6">
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
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "") })}
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
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })}
                  className="w-full bg-[#F9F8F4] border border-charcoal/10 rounded-sm px-4 py-3 text-xs text-charcoal focus:outline-none focus:border-charcoal/30 transition-all"
                  min="0"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/5">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal/40 hover:text-charcoal transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-burgundy hover:bg-burgundy/90 text-[#F5F1E8] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-lg shadow-burgundy/5 transition-all hover:-translate-y-0.5 active:scale-95 duration-300"
                >
                  {selectedCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Popup */}
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

import { useState, useEffect, useCallback } from "react";
import { categoriesApi } from "../api";
import { Category } from "../types";
import { toast } from "sonner";

export function useAdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const saveCategory = async (
    selectedCategory: Category | null,
    formData: { name: string; slug: string; parentId: string; position: number }
  ) => {
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

  const deleteCategory = async (id: string) => {
    try {
      await categoriesApi.deleteCategory(id);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete category");
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    saveCategory,
    deleteCategory,
  };
}

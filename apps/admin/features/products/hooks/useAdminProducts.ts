import { useState, useEffect, useCallback } from "react";
import { productsApi } from "../api";
import { Product, Category } from "../types";
import { toast } from "sonner";

export function useAdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodData, catData] = await Promise.all([
        productsApi.getProducts(),
        productsApi.getCategories(),
      ]);
      setCategories(catData);
      setProducts(prodData);
    } catch (err: any) {
      console.error("API error loading catalog:", err);
      setError(err.message || "Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const saveProduct = async (
    selectedProduct: Product | null,
    formData: Product
  ) => {
    try {
      if (selectedProduct) {
        // Edit product
        await productsApi.updateProduct(selectedProduct.id!, formData);
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? { ...formData } : p))
        );
        toast.success("Product successfully re-curated");
      } else {
        // Create product
        const addedProduct = await productsApi.createProduct(formData);
        setProducts((prev) => [addedProduct, ...prev]);
        toast.success("Product successfully commissioned to catalog");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save product");
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productsApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product decommissioned and removed");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to decommission product");
      throw err;
    }
  };

  return {
    products,
    categories,
    loading,
    error,
    refetch: fetchCatalog,
    saveProduct,
    deleteProduct,
  };
}

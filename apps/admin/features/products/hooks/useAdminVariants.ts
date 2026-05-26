import { useState, useEffect, useCallback } from "react";
import { productsApi } from "../api";
import { Variant, Product } from "../types";
import { toast } from "sonner";

export function useAdminVariants(productId: string) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const [variantsData, productData] = await Promise.all([
        productsApi.getVariants(productId),
        productsApi.getProduct(productId),
      ]);
      setVariants(variantsData);
      setProduct(productData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const saveVariant = async (
    selectedVariant: Variant | null,
    formData: Partial<Variant>
  ) => {
    try {
      if (selectedVariant) {
        await productsApi.updateVariant(selectedVariant.id, formData);
        toast.success("Variant specification updated");
      } else {
        await productsApi.createVariant(productId, formData);
        toast.success("New variant committed successfully");
      }
      fetchVariants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save variant");
      throw err;
    }
  };

  const deleteVariant = async (variantId: string) => {
    try {
      await productsApi.deleteVariant(variantId);
      toast.success("Variant successfully purged");
      fetchVariants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete variant");
      throw err;
    }
  };

  return {
    variants,
    product,
    loading,
    error,
    refetch: fetchVariants,
    saveVariant,
    deleteVariant,
  };
}

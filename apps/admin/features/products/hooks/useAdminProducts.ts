import { useState, useEffect, useCallback } from "react";
import { productsApi } from "../api";
import { Product, Category } from "../types";
import { imageKitUrl } from "../../../lib/imagekit";
import { toast } from "sonner";

const FLAGSHIP_MOCK_PRODUCTS: Product[] = [
  {
    id: "piper-mocha-id",
    title: "PIPER SANDALS",
    slug: "piper-mocha",
    brand: "Tasheen",
    shortDesc: "Chic heeled sandals in a premium mocha dot style.",
    longDescHtml: "Artisan-crafted in Italy with mocha dots pattern. Cushioned inner soles and sturdy stacked block heels for luxury wear.",
    status: "PUBLISHED",
    price: 230.00,
    compareAtPrice: 280.00,
    currency: "USD",
    categoryIds: ["shoes-category-id"],
    sizes: [
      { value: "35", isAvailable: true },
      { value: "36", isAvailable: true },
      { value: "38", isAvailable: true },
      { value: "39", isAvailable: true },
    ],
    images: [imageKitUrl("piper_mocha_primary.png")]
  },
  {
    id: "suki-mocha-id",
    title: "SUKI MULES",
    slug: "suki-mocha",
    brand: "Tasheen",
    shortDesc: "Slip-on luxury open-back heeled mules with clean seams.",
    longDescHtml: "Minimalist, luxury open-back mules constructed from custom double-stitched leather.",
    status: "PUBLISHED",
    price: 230.00,
    compareAtPrice: null,
    currency: "USD",
    categoryIds: ["shoes-category-id"],
    sizes: [
      { value: "35", isAvailable: true },
      { value: "36", isAvailable: true },
      { value: "37", isAvailable: true },
    ],
    images: [imageKitUrl("suki_mocha_primary.png")]
  }
];

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
      setProducts(prodData.length > 0 ? prodData : FLAGSHIP_MOCK_PRODUCTS);
    } catch (err: any) {
      console.warn("API offline or empty. Fallback activated.", err);
      setProducts(FLAGSHIP_MOCK_PRODUCTS);
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
        const isMock = selectedProduct.id?.includes("-id");
        if (isMock) {
          setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? { ...formData } : p)));
        } else {
          await productsApi.updateProduct(selectedProduct.id!, formData);
          setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? { ...formData } : p)));
        }
        toast.success("Product successfully re-curated");
      } else {
        // Create product
        try {
          const addedProduct = await productsApi.createProduct(formData);
          setProducts((prev) => {
            const realProducts = prev.filter((p) => !p.id?.includes("-id"));
            return [addedProduct, ...realProducts];
          });
          toast.success("Product successfully commissioned to catalog");
        } catch (err) {
          const newProduct: Product = {
            ...formData,
            id: `new-product-${Date.now()}-id`,
            images: formData.images?.length ? formData.images : [imageKitUrl("cat-heeled-sandals.png")]
          };
          setProducts((prev) => [newProduct, ...prev]);
          throw new Error("Product saved locally (API unreachable). It will not persist on refresh.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save product");
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (id.includes("-id")) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Sandbox product discarded successfully");
      } else {
        await productsApi.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product decommissioned and removed");
      }
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

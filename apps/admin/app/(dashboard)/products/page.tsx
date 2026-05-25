"use client";

import React, { useState, useEffect } from "react";
import { ProductRegistry } from "../../../features/products/components/ProductRegistry";
import { ProductDrawer } from "../../../features/products/components/ProductDrawer";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { productsApi } from "../../../features/products/api";
import { Product, Category } from "../../../features/products/types";
import { imageKitUrl } from "../../../lib/imagekit";
import { toast } from "sonner";

// Graceful Sandbox Mock Products representing Tasheen's flagship premium lines
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        productsApi.getCategories(),
        productsApi.getProducts()
      ]);
      setCategories(cats);
      
      if (prods.length > 0) {
        setProducts(prods);
      } else {
        setProducts(FLAGSHIP_MOCK_PRODUCTS);
      }
    } catch (err: any) {
      console.warn("API offline or empty. Graceful fallback activated.", err);
      setProducts(FLAGSHIP_MOCK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      if (productToDelete.includes("-id")) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
        toast.success("Sandbox product discarded successfully");
      } else {
        await productsApi.deleteProduct(productToDelete);
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
        toast.success("Product deleted successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove product");
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = async (formData: Product) => {
    if (selectedProduct) {
      // ── Edit existing product ──
      const isMock = selectedProduct.id?.includes("-id");
      if (isMock) {
        // Mock products can't be updated on the server
        setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? { ...formData } : p)));
      } else {
        await productsApi.updateProduct(selectedProduct.id!, formData);
        setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? { ...formData } : p)));
      }
    } else {
      // ── Create new product — always call the real API ──
      try {
        const addedProduct = await productsApi.createProduct(formData);
        // Replace mock products with real data once a real product is created
        setProducts((prev) => {
          const realProducts = prev.filter((p) => !p.id?.includes("-id"));
          return [addedProduct, ...realProducts];
        });
      } catch {
        // If API is unreachable, fall back to a local mock
        const newProduct: Product = {
          ...formData,
          id: `new-product-${Date.now()}-id`,
          images: formData.images?.length ? formData.images : [imageKitUrl("cat-heeled-sandals.png")]
        };
        setProducts((prev) => [newProduct, ...prev]);
        throw new Error("Product saved locally (API unreachable). It will not persist on refresh.");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-charcoal/40 font-bold uppercase tracking-widest">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span className="text-charcoal/80">Product Catalog</span>
          </div>
          <h1 className="text-3xl font-serif text-charcoal mt-1">Boutique Catalog Registry</h1>
          <p className="text-[11px] font-bold text-charcoal/70 uppercase tracking-widest mt-1">
            Curate and manage your luxury footwear, editorial collections, and inventory sizing matrices.
          </p>
        </div>
      </div>

      <ProductRegistry
        products={products}
        categories={categories}
        onEdit={(p) => { setSelectedProduct(p); setIsDrawerOpen(true); }}
        onDelete={(id) => { setProductToDelete(id); setIsDeleteModalOpen(true); }}
        onAddNew={() => { setSelectedProduct(null); setIsDrawerOpen(true); }}
        isLoading={isLoading}
        onRefresh={loadData}
      />

      <ProductDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        onSave={handleSaveProduct}
        categories={categories}
      />

      {isDeleteModalOpen && (
        <ConfirmModal
          title="Discard Catalog Entry"
          message="Are you completely sure you want to discard this product? This action will permanently remove it from both the catalog and active customer storefront listings."
          confirmLabel="Discard Entry"
          cancelLabel="Keep Product"
          onConfirm={handleDeleteConfirm}
          onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { ProductRegistry } from "../../../features/products/components/ProductRegistry";
import { ProductDrawer } from "../../../features/products/components/ProductDrawer";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { useAdminProducts } from "../../../features/products/hooks/useAdminProducts";
import { Product } from "../../../features/products/types";

export default function ProductsPage() {
  const { products, categories, loading, refetch, saveProduct, deleteProduct } = useAdminProducts();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete);
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = async (formData: Product) => {
    await saveProduct(selectedProduct, formData);
    setIsDrawerOpen(false);
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
        isLoading={loading}
        onRefresh={refetch}
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

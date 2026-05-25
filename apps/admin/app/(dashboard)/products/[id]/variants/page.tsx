"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { productsApi } from "../../../../../features/products/api";
import { VariantTable } from "../../../../../features/products/components/VariantTable";
import { VariantModal } from "../../../../../features/products/components/VariantModal";
import { Variant } from "../../../../../features/products/types";
import { ArrowLeft, Box, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function VariantsManagementPage() {
  const params = useParams();
  const productId = params.id as string;

  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productTitle, setProductTitle] = useState("Loading...");

  const [isEditing, setIsEditing] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<Partial<Variant> | null>(null);

  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      const prod = await productsApi.getProduct(productId);
      if (prod) {
        setProductTitle(prod.title);
      }

      const list = await productsApi.getVariants(productId);
      const sortedItems = [...list].sort((a, b) => {
        const sizeA = a.size ? parseFloat(a.size) : NaN;
        const sizeB = b.size ? parseFloat(b.size) : NaN;
        if (!isNaN(sizeA) && !isNaN(sizeB)) return sizeA - sizeB;
        if (!isNaN(sizeA)) return -1;
        if (!isNaN(sizeB)) return 1;
        return (a.size || "").localeCompare(b.size || "");
      });
      setVariants(sortedItems);
    } catch (err) {
      toast.error("Failed to load variants");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  const handleDelete = (variantId: string) => {
    toast.error("Are you sure you want to delete this variant?", {
      description: "This will permanently remove this variant from the catalog.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await productsApi.deleteVariant(variantId);
            toast.success("Variant deleted successfully");
            fetchVariants();
          } catch (err) {
            toast.error("Failed to delete variant");
          }
        },
      },
    });
  };

  const handleSave = async (variantData: Partial<Variant>) => {
    try {
      if (variantData.id) {
        await productsApi.updateVariant(variantData.id, variantData);
        toast.success("Variant updated");
      } else {
        await productsApi.createVariant(productId, variantData);
        toast.success("Variant created");
      }
      fetchVariants();
    } catch (err) {
      toast.error("Failed to save variant");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6]">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-charcoal/10">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 -ml-2 text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-charcoal flex items-center gap-2">
              <Box className="w-5 h-5 text-burgundy" />
              Manage Variants
            </h1>
            <p className="text-sm text-charcoal/50 mt-1">
              {productTitle} • {variants.length} Variants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchVariants}
            className="flex items-center justify-center p-2 text-charcoal/40 hover:text-charcoal border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-all"
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <VariantTable
          variants={variants}
          isLoading={isLoading}
          onEdit={(v) => { setCurrentVariant(v); setIsEditing(true); }}
          onDelete={handleDelete}
          onAddNew={() => {
            setCurrentVariant({
              sku: "",
              size: "",
              color: "",
              barcode: "",
              allowBackorder: false,
              allowPreorder: false,
            });
            setIsEditing(true);
          }}
        />
      </div>

      <VariantModal
        isOpen={isEditing}
        onClose={() => { setIsEditing(false); setCurrentVariant(null); }}
        variant={currentVariant}
        onSave={handleSave}
      />
    </div>
  );
}

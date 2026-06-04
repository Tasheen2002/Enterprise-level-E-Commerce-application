"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useAdminVariants } from "../../../../../features/products/hooks/useAdminVariants";
import { VariantTable } from "../../../../../features/products/components/VariantTable";
import { VariantModal } from "../../../../../features/products/components/VariantModal";
import { Variant } from "../../../../../features/products/types";
import { ArrowLeft, Box, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function VariantsManagementPage() {
  const params = useParams();
  const productId = params.id as string;

  const { variants, product, loading, refetch, saveVariant, deleteVariant } = useAdminVariants(productId);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<Partial<Variant> | null>(null);

  const productTitle = product ? product.title : "Loading...";

  const handleDelete = (variantId: string) => {
    toast.error("Are you sure you want to delete this variant?", {
      description: "This will permanently remove this variant from the catalog.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteVariant(variantId);
          } catch (err) {
            toast.error("Failed to delete variant");
          }
        },
      },
    });
  };

  const handleSave = async (variantData: Partial<Variant>) => {
    try {
      await saveVariant(currentVariant as any, variantData);
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to save variant");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6]">
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
            onClick={refetch}
            className="flex items-center justify-center p-2 text-charcoal/40 hover:text-charcoal border border-charcoal/10 rounded-full hover:bg-charcoal/5 transition-all"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <VariantTable
          variants={variants}
          isLoading={loading}
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

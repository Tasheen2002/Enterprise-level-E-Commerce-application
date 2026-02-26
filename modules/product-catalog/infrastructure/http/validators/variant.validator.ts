import { z } from "zod";

export const createVariantSchema = z.object({
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(100, "SKU cannot exceed 100 characters"),
  size: z.string().max(50, "Size cannot exceed 50 characters").optional(),
  color: z.string().max(50, "Color cannot exceed 50 characters").optional(),
  barcode: z
    .string()
    .max(100, "Barcode cannot exceed 100 characters")
    .optional(),
  weightG: z
    .number()
    .nonnegative("Weight must be non-negative")
    .optional(),
  dims: z.record(z.string(), z.unknown()).optional(),
  taxClass: z
    .string()
    .max(100, "Tax class cannot exceed 100 characters")
    .optional(),
  allowBackorder: z.boolean().optional(),
  allowPreorder: z.boolean().optional(),
  restockEta: z.iso.datetime().optional(),
});

export const updateVariantSchema = createVariantSchema.partial();

export const listVariantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  size: z.string().optional(),
  color: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(["sku", "createdAt", "size", "color"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const variantIdParamSchema = z.object({
  id: z.string().min(1, "Variant ID is required"),
});

export const productVariantParamSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ListVariantsQueryInput = z.infer<typeof listVariantsQuerySchema>;

import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const variantParamsSchema = z.object({
  variantId: z.string().uuid(),
});

export const variantByProductParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const listVariantsSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  size: z.string().optional(),
  color: z.string().optional(),
  sortBy: z.enum(["sku", "createdAt", "size", "color"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

const dimsSchema = z.object({
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
});

export const createVariantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  barcode: z.string().optional(),
  weightG: z.number().int().min(0).optional(),
  dims: dimsSchema.optional(),
  taxClass: z.string().optional(),
  allowBackorder: z.boolean().optional().default(false),
  allowPreorder: z.boolean().optional().default(false),
  restockEta: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
});

export const updateVariantSchema = z.object({
  sku: z.string().min(1).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  barcode: z.string().optional(),
  weightG: z.number().int().min(0).optional(),
  dims: dimsSchema.optional(),
  taxClass: z.string().optional(),
  allowBackorder: z.boolean().optional(),
  allowPreorder: z.boolean().optional(),
  restockEta: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type VariantParams = z.infer<typeof variantParamsSchema>;
export type VariantByProductParams = z.infer<typeof variantByProductParamsSchema>;
export type ListVariantsQuery = z.infer<typeof listVariantsSchema>;
export type CreateVariantBody = z.infer<typeof createVariantSchema>;
export type UpdateVariantBody = z.infer<typeof updateVariantSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const variantResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    productId: { type: "string", format: "uuid" },
    sku: { type: "string" },
    size: { type: "string", nullable: true },
    color: { type: "string", nullable: true },
    barcode: { type: "string", nullable: true },
    weightG: { type: "integer", nullable: true },
    dims: { type: "object", nullable: true },
    taxClass: { type: "string", nullable: true },
    allowBackorder: { type: "boolean" },
    allowPreorder: { type: "boolean" },
    restockEta: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

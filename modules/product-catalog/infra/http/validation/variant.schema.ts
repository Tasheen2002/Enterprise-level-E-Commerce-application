import { z } from "zod";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
} from "../../../domain/constants/pagination.constants";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const variantParamsSchema = z.object({
  variantId: z.uuid(),
});

export const variantByProductParamsSchema = z.object({
  productId: z.uuid(),
});

export const listVariantsSchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
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
  restockEta: z.coerce.date().optional(),
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
  restockEta: z.coerce.date().optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type VariantParams = z.infer<typeof variantParamsSchema>;
export type VariantByProductParams = z.infer<typeof variantByProductParamsSchema>;
export type ListVariantsQuery = z.infer<typeof listVariantsSchema>;
export type CreateVariantBody = z.infer<typeof createVariantSchema>;
export type UpdateVariantBody = z.infer<typeof updateVariantSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

// Mirrors VariantDimensions interface from the domain entity.
const dimsResponseSchema = {
  type: "object",
  nullable: true,
  properties: {
    length: { type: "number" },
    width: { type: "number" },
    height: { type: "number" },
  },
} as const;

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
    dims: dimsResponseSchema,
    taxClass: { type: "string", nullable: true },
    allowBackorder: { type: "boolean" },
    allowPreorder: { type: "boolean" },
    restockEta: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// Matches PaginatedResult<ProductVariantDTO> from packages/core.
export const paginatedVariantsResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: variantResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

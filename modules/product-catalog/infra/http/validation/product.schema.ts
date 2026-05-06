import { z } from "zod";
import { ProductStatus } from "../../../domain/value-objects";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
} from "../../../domain/constants/pagination.constants";

// Statuses allowed when authoring products (clients cannot create directly into ARCHIVED).
const CREATABLE_PRODUCT_STATUSES = [
  ProductStatus.DRAFT,
  ProductStatus.PUBLISHED,
  ProductStatus.SCHEDULED,
] as const;

const ALL_PRODUCT_STATUSES = [
  ProductStatus.DRAFT,
  ProductStatus.PUBLISHED,
  ProductStatus.SCHEDULED,
  ProductStatus.ARCHIVED,
] as [ProductStatus, ...ProductStatus[]];

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const productParamsSchema = z.object({
  productId: z.uuid(),
});

export const productSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const listProductsSchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
  status: z.enum(ALL_PRODUCT_STATUSES).optional(),
  categoryId: z.uuid().optional(),
  brand: z.string().optional(),
  includeDrafts: z.coerce.boolean().optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "publishAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createProductSchema = z.object({
  title: z.string().min(1),
  brand: z.string().optional(),
  shortDesc: z.string().optional(),
  longDescHtml: z.string().optional(),
  status: z.enum(CREATABLE_PRODUCT_STATUSES).optional().default(ProductStatus.DRAFT),
  publishAt: z.coerce.date().optional(),
  countryOfOrigin: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  price: z.number().min(0).optional(),
  priceSgd: z.number().min(0).optional(),
  priceUsd: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  categoryIds: z.array(z.uuid()).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  brand: z.string().optional(),
  shortDesc: z.string().optional(),
  longDescHtml: z.string().optional(),
  status: z.enum(ALL_PRODUCT_STATUSES).optional(),
  publishAt: z.coerce.date().optional(),
  countryOfOrigin: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  price: z.number().min(0).optional(),
  priceSgd: z.number().min(0).nullable().optional(),
  priceUsd: z.number().min(0).nullable().optional(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  categoryIds: z.array(z.uuid()).optional(),
  tags: z.array(z.string()).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type ProductParams = z.infer<typeof productParamsSchema>;
export type ProductSlugParams = z.infer<typeof productSlugParamsSchema>;
export type ListProductsQuery = z.infer<typeof listProductsSchema>;
export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const productResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    title: { type: "string" },
    slug: { type: "string" },
    brand: { type: "string", nullable: true },
    shortDesc: { type: "string", nullable: true },
    longDescHtml: { type: "string", nullable: true },
    status: { type: "string", enum: ALL_PRODUCT_STATUSES as unknown as string[] },
    publishAt: { type: "string", format: "date-time", nullable: true },
    countryOfOrigin: { type: "string", nullable: true },
    seoTitle: { type: "string", nullable: true },
    seoDescription: { type: "string", nullable: true },
    price: { type: "number" },
    priceSgd: { type: "number", nullable: true },
    priceUsd: { type: "number", nullable: true },
    compareAtPrice: { type: "number", nullable: true },
    currency: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

// Matches PaginatedResult<T> from packages/core.
export const paginatedProductsResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: productResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const productParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const productSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const listProductsSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
  categoryId: z.string().uuid().optional(),
  brand: z.string().optional(),
  includeDrafts: z.string().optional().transform((v) => v === "true"),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "publishAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createProductSchema = z.object({
  title: z.string().min(1),
  brand: z.string().optional(),
  shortDesc: z.string().optional(),
  longDescHtml: z.string().optional(),
  status: z.enum(["draft", "published", "scheduled"]).optional().default("draft"),
  publishAt: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  countryOfOrigin: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  price: z.number().min(0).optional(),
  priceSgd: z.number().min(0).optional(),
  priceUsd: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  brand: z.string().optional(),
  shortDesc: z.string().optional(),
  longDescHtml: z.string().optional(),
  status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
  publishAt: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  countryOfOrigin: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  price: z.number().min(0).optional(),
  priceSgd: z.number().min(0).nullable().optional(),
  priceUsd: z.number().min(0).nullable().optional(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
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
    status: { type: "string", enum: ["draft", "published", "scheduled", "archived"] },
    publishAt: { type: "string", format: "date-time", nullable: true },
    countryOfOrigin: { type: "string", nullable: true },
    seoTitle: { type: "string", nullable: true },
    seoDescription: { type: "string", nullable: true },
    price: { type: "number" },
    priceSgd: { type: "number", nullable: true },
    priceUsd: { type: "number", nullable: true },
    compareAtPrice: { type: "number", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const paginatedProductsResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        products: { type: "array", items: productResponseSchema },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
      },
    },
  },
} as const;

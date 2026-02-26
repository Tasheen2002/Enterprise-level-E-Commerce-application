import { z } from "zod";

const productStatusSchema = z.enum(["draft", "published", "scheduled"]);

export const createProductSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title cannot exceed 500 characters"),
  brand: z.string().max(200, "Brand cannot exceed 200 characters").optional(),
  shortDesc: z
    .string()
    .max(1000, "Short description cannot exceed 1000 characters")
    .optional(),
  longDescHtml: z
    .string()
    .max(100000, "Long description cannot exceed 100000 characters")
    .optional(),
  status: productStatusSchema.optional(),
  publishAt: z.iso.datetime().optional(),
  countryOfOrigin: z
    .string()
    .max(100, "Country of origin cannot exceed 100 characters")
    .optional(),
  seoTitle: z
    .string()
    .max(200, "SEO title cannot exceed 200 characters")
    .optional(),
  seoDescription: z
    .string()
    .max(500, "SEO description cannot exceed 500 characters")
    .optional(),
  price: z.number().nonnegative("Price must be non-negative").optional(),
  priceSgd: z
    .number()
    .nonnegative("SGD price must be non-negative")
    .optional(),
  priceUsd: z
    .number()
    .nonnegative("USD price must be non-negative")
    .optional(),
  compareAtPrice: z
    .number()
    .nonnegative("Compare-at price must be non-negative")
    .optional(),
  categoryIds: z
    .array(z.uuid("Each category ID must be a valid UUID"))
    .optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
  brand: z.string().optional(),
  categoryId: z.uuid("categoryId must be a valid UUID").optional(),
  search: z.string().optional(),
  includeDrafts: z.coerce.boolean().default(false),
  sortBy: z.enum(["createdAt", "title", "publishAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const productIdParamSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const productSlugParamSchema = z.object({
  slug: z.string().min(1, "Product slug is required"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>;

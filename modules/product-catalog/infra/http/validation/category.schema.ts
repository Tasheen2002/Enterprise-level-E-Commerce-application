import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const categoryParamsSchema = z.object({
  id: z.string().uuid(),
});

export const categorySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const listCategoriesSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("50").transform(Number),
  parentId: z.string().uuid().optional(),
  includeChildren: z.string().optional().transform((v) => v === "true"),
  sortBy: z.enum(["name", "position"]).optional().default("position"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  parentId: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderCategoriesSchema = z.object({
  categoryOrders: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    }),
  ).min(1),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type CategorySlugParams = z.infer<typeof categorySlugParamsSchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesSchema>;
export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesBody = z.infer<typeof reorderCategoriesSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const categoryResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    slug: { type: "string" },
    parentId: { type: "string", format: "uuid", nullable: true },
    position: { type: "integer", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

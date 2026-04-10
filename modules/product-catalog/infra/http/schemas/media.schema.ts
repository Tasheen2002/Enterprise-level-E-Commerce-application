import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const mediaParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listMediaSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default("1").transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  mimeType: z.string().optional(),
  isImage: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  isVideo: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  hasRenditions: z.string().optional().transform((v) => v === undefined ? undefined : v === "true"),
  minBytes: z.string().regex(/^\d+$/).optional().transform(Number),
  maxBytes: z.string().regex(/^\d+$/).optional().transform(Number),
  minWidth: z.string().regex(/^\d+$/).optional().transform(Number),
  maxWidth: z.string().regex(/^\d+$/).optional().transform(Number),
  minHeight: z.string().regex(/^\d+$/).optional().transform(Number),
  maxHeight: z.string().regex(/^\d+$/).optional().transform(Number),
  sortBy: z.enum(["createdAt", "bytes", "width", "height", "version"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createMediaSchema = z.object({
  storageKey: z.string().min(1),
  mime: z.string().min(1),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  bytes: z.number().int().min(0).optional(),
  altText: z.string().optional(),
  focalX: z.number().int().optional(),
  focalY: z.number().int().optional(),
  renditions: z.record(z.unknown()).optional(),
});

export const updateMediaSchema = z.object({
  mime: z.string().optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  bytes: z.number().int().min(0).optional(),
  altText: z.string().optional(),
  focalX: z.number().int().optional(),
  focalY: z.number().int().optional(),
  renditions: z.record(z.unknown()).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type MediaParams = z.infer<typeof mediaParamsSchema>;
export type ListMediaQuery = z.infer<typeof listMediaSchema>;
export type CreateMediaBody = z.infer<typeof createMediaSchema>;
export type UpdateMediaBody = z.infer<typeof updateMediaSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const mediaResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    storageKey: { type: "string" },
    mime: { type: "string" },
    width: { type: "integer", nullable: true },
    height: { type: "integer", nullable: true },
    bytes: { type: "integer", nullable: true },
    altText: { type: "string", nullable: true },
    focalX: { type: "integer", nullable: true },
    focalY: { type: "integer", nullable: true },
    renditions: { type: "object", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

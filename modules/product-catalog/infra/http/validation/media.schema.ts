import { z } from "zod";
import {
  MIN_PAGE,
  MIN_LIMIT,
  MAX_PAGE_SIZE,
} from "../../../domain/constants/pagination.constants";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const mediaParamsSchema = z.object({
  id: z.uuid(),
});

export const listMediaSchema = z.object({
  page: z.coerce.number().int().min(MIN_PAGE).optional().default(MIN_PAGE),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_PAGE_SIZE).optional().default(20),
  mimeType: z.string().optional(),
  isImage: z.coerce.boolean().optional(),
  isVideo: z.coerce.boolean().optional(),
  hasRenditions: z.coerce.boolean().optional(),
  minBytes: z.coerce.number().int().min(0).optional(),
  maxBytes: z.coerce.number().int().min(0).optional(),
  minWidth: z.coerce.number().int().min(0).optional(),
  maxWidth: z.coerce.number().int().min(0).optional(),
  minHeight: z.coerce.number().int().min(0).optional(),
  maxHeight: z.coerce.number().int().min(0).optional(),
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
  renditions: z.record(z.string(), z.unknown()).optional(),
});

export const updateMediaSchema = z.object({
  mime: z.string().optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  bytes: z.number().int().min(0).optional(),
  altText: z.string().optional(),
  focalX: z.number().int().optional(),
  focalY: z.number().int().optional(),
  renditions: z.record(z.string(), z.unknown()).optional(),
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

// Matches PaginatedResult<MediaAssetDTO> from packages/core.
export const paginatedMediaResponseSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: mediaResponseSchema },
    total: { type: "integer" },
    limit: { type: "integer" },
    offset: { type: "integer" },
    hasMore: { type: "boolean" },
  },
} as const;

import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const locationParamsSchema = z.object({
  locationId: z.uuid(),
});

export const listLocationsSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
  type: z.enum(["warehouse", "store", "vendor"]).optional(),
});

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const createLocationSchema = z.object({
  type: z.enum(["warehouse", "store", "vendor"]),
  name: z.string().min(1).max(255),
  address: addressSchema.optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: addressSchema.optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type LocationParams = z.infer<typeof locationParamsSchema>;
export type ListLocationsQuery = z.infer<typeof listLocationsSchema>;
export type CreateLocationBody = z.infer<typeof createLocationSchema>;
export type UpdateLocationBody = z.infer<typeof updateLocationSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const locationResponseSchema = {
  type: "object",
  properties: {
    locationId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["warehouse", "store", "vendor"] },
    name: { type: "string" },
    address: {
      nullable: true,
      type: "object",
      properties: {
        addressLine1: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        postalCode: { type: "string" },
        country: { type: "string" },
      },
    },
  },
} as const;

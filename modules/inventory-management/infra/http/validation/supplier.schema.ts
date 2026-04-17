import { z } from "zod";

// ── Request Schemas (Zod) ─────────────────────────────────────────────────────

export const supplierParamsSchema = z.object({
  supplierId: z.uuid(),
});

export const listSuppliersSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
  offset: z.string().regex(/^\d+$/).optional().default("0").transform(Number),
});

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(128),
  leadTimeDays: z.number().int().min(0).max(365).optional(),
  contacts: z.array(contactSchema).optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(2).max(128).optional(),
  leadTimeDays: z.number().int().min(0).max(365).optional(),
  contacts: z.array(contactSchema).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type SupplierParams = z.infer<typeof supplierParamsSchema>;
export type ListSuppliersQuery = z.infer<typeof listSuppliersSchema>;
export type CreateSupplierBody = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierBody = z.infer<typeof updateSupplierSchema>;

// ── JSON Schema for Swagger docs ──────────────────────────────────────────────

export const supplierResponseSchema = {
  type: "object",
  properties: {
    supplierId: { type: "string", format: "uuid" },
    name: { type: "string" },
    leadTimeDays: { type: "integer", nullable: true },
    contacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
        },
      },
    },
  },
} as const;

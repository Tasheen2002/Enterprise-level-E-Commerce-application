import { z } from "zod";

export const createBnplTransactionSchema = z.object({
  intentId: z.uuid(),
  provider: z.string().min(1),
  plan: z.object({
    installments: z.number().int().positive(),
    frequency: z.string().min(1),
    downPayment: z.number().optional(),
    interestRate: z.number().optional(),
  }),
});

export const bnplParamsSchema = z.object({
  bnplId: z.uuid(),
  action: z.enum(["approve", "reject", "activate", "complete", "cancel", "fail"]),
});

export const listBnplQuerySchema = z.object({
  bnplId: z.uuid().optional(),
  intentId: z.uuid().optional(),
  orderId: z.uuid().optional(),
});

export type CreateBnplTransactionBody = z.infer<typeof createBnplTransactionSchema>;
export type BnplParams = z.infer<typeof bnplParamsSchema>;
export type ListBnplQuery = z.infer<typeof listBnplQuerySchema>;

export const bnplPlanResponseSchema = {
  type: "object",
  properties: {
    installments: { type: "integer" },
    frequency: { type: "string" },
    downPayment: { type: "number" },
    interestRate: { type: "number" },
  },
} as const;

export const bnplTransactionResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    intentId: { type: "string", format: "uuid" },
    provider: { type: "string" },
    plan: bnplPlanResponseSchema,
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

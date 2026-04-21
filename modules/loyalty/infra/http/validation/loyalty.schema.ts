import { z } from "zod";

export const earnRuleSchema = z.object({
  type: z.string().min(1),
  points: z.number(),
  minPurchase: z.number().optional(),
}).catchall(z.unknown());

export const burnRuleSchema = z.object({
  type: z.string().min(1),
  pointsRequired: z.number(),
  value: z.number(),
}).catchall(z.unknown());

export const loyaltyTierConfigSchema = z.object({
  name: z.string().min(1),
  minPoints: z.number(),
  benefits: z.array(z.string()),
}).catchall(z.unknown());

export const createLoyaltyProgramSchema = z.object({
  name: z.string().min(1).max(100),
  earnRules: z.array(earnRuleSchema),
  burnRules: z.array(burnRuleSchema),
  tiers: z.array(loyaltyTierConfigSchema),
});

export const awardPointsSchema = z.object({
  userId: z.uuid(),
  points: z.number().int().positive(),
  reason: z.string().min(1),
  orderId: z.uuid().optional(),
  description: z.string().max(255).optional(),
});

export const redeemPointsSchema = z.object({
  userId: z.uuid(),
  points: z.number().int().positive(),
  orderId: z.uuid().optional(),
  reason: z.string().optional(),
});

export const adjustPointsSchema = z.object({
  userId: z.uuid(),
  points: z.number().int().positive(),
  isAddition: z.boolean(),
  reason: z.string().min(1),
  createdBy: z.string().min(1),
});

export const getAccountQuerySchema = z.object({
  userId: z.string().min(1),
});

export const listTransactionsQuerySchema = z.object({
  accountId: z.uuid().optional(),
  orderId: z.uuid().optional(),
});

export const loyaltyEarnRuleResponseSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    pointsPerUnit: { type: "number" },
    minAmount: { type: "number" },
    maxPoints: { type: "number" },
  },
} as const;

export const loyaltyBurnRuleResponseSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    pointsRequired: { type: "number" },
    discountValue: { type: "number" },
  },
} as const;

export const loyaltyTierResponseSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    minPoints: { type: "number" },
    multiplier: { type: "number" },
  },
} as const;

export const loyaltyProgramResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    earnRules: { type: "array", items: loyaltyEarnRuleResponseSchema },
    burnRules: { type: "array", items: loyaltyBurnRuleResponseSchema },
    tiers: { type: "array", items: loyaltyTierResponseSchema },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const loyaltyAccountResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    currentBalance: { type: "number" },
    totalPointsEarned: { type: "number" },
    totalPointsRedeemed: { type: "number" },
    lifetimePoints: { type: "number" },
    tier: { type: "string" },
    tierMultiplier: { type: "number" },
    nextTier: { type: "string", nullable: true },
    pointsToNextTier: { type: "number", nullable: true },
    joinedAt: { type: "string", format: "date-time" },
    lastActivityAt: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const loyaltyTransactionResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    accountId: { type: "string", format: "uuid" },
    type: { type: "string" },
    points: { type: "number" },
    reason: { type: "string" },
    description: { type: "string", nullable: true },
    referenceId: { type: "string", nullable: true },
    orderId: { type: "string", format: "uuid", nullable: true },
    createdBy: { type: "string", nullable: true },
    expiresAt: { type: "string", format: "date-time", nullable: true },
    balanceAfter: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export type CreateLoyaltyProgramBody = z.infer<typeof createLoyaltyProgramSchema>;
export type AwardPointsBody = z.infer<typeof awardPointsSchema>;
export type RedeemPointsBody = z.infer<typeof redeemPointsSchema>;
export type AdjustPointsBody = z.infer<typeof adjustPointsSchema>;
export type GetAccountQuery = z.infer<typeof getAccountQuerySchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

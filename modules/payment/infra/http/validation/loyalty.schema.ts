import { z } from "zod";

export const createLoyaltyProgramSchema = z.object({
  name: z.string().min(1).max(100),
  earnRules: z.array(z.record(z.string(), z.unknown())),
  burnRules: z.array(z.record(z.string(), z.unknown())),
  tiers: z.array(z.record(z.string(), z.unknown())),
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
  orderId: z.uuid(),
  reason: z.string().optional(),
});

export const adjustPointsSchema = z.object({
  userId: z.uuid(),
  points: z.number().int().positive(),
  isAddition: z.boolean(),
  reason: z.string().min(1),
  createdBy: z.string().min(1),
});

export const getLoyaltyAccountQuerySchema = z.object({
  userId: z.string().min(1),
});

export const listLoyaltyTransactionsQuerySchema = z.object({
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
    joinedAt: { type: "string", format: "date-time" },
    lastActivityAt: { type: "string", format: "date-time" },
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
    description: { type: "string" },
    referenceId: { type: "string" },
    orderId: { type: "string", format: "uuid" },
    createdBy: { type: "string" },
    expiresAt: { type: "string", format: "date-time" },
    balanceAfter: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

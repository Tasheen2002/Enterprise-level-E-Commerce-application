import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { PaginatedResult } from "../src";
import { LoyaltyAccountRepositoryImpl } from "../../../modules/loyalty/infra/persistence/repositories/loyalty-account.repository.impl";
import { LoyaltyAccount } from "../../../modules/loyalty/domain/entities/loyalty-account.entity";

const record = {
  accountId: "123e4567-e89b-42d3-a456-426614174000",
  userId: "123e4567-e89b-42d3-a456-426614174001",
  currentBalance: 0n,
  totalPointsEarned: 0n,
  totalPointsRedeemed: 0n,
  lifetimePoints: 0n,
  tier: "STYLE_LOVER",
  joinedAt: new Date("2026-10-23T00:00:00Z"),
  lastActivityAt: null,
  createdAt: new Date("2026-10-23T00:00:00Z"),
  updatedAt: new Date("2026-10-23T00:00:00Z"),
};

describe("core pagination contract at an actual repository boundary", () => {
  it.each([
    {
      name: "empty unbounded result",
      records: [],
      total: 0,
      options: undefined,
      limit: 0,
      offset: 0,
      hasMore: false,
    },
    {
      name: "unbounded result",
      records: [record],
      total: 1,
      options: undefined,
      limit: 1,
      offset: 0,
      hasMore: false,
    },
    {
      name: "first bounded page",
      records: [record],
      total: 3,
      options: { limit: 1, offset: 0 },
      limit: 1,
      offset: 0,
      hasMore: true,
    },
    {
      name: "last bounded page",
      records: [record],
      total: 3,
      options: { limit: 1, offset: 2 },
      limit: 1,
      offset: 2,
      hasMore: false,
    },
    {
      name: "offset beyond total",
      records: [],
      total: 3,
      options: { limit: 1, offset: 5 },
      limit: 1,
      offset: 5,
      hasMore: false,
    },
  ])(
    "preserves metadata for $name",
    async ({ records, total, options, limit, offset, hasMore }) => {
      // Inert adapter: executes real repository mapping without connecting to a database.
      const findMany = vi.fn().mockResolvedValue(records);
      const count = vi.fn().mockResolvedValue(total);
      const prisma = { loyaltyAccount: { findMany, count } } as unknown as PrismaClient;
      const repository = new LoyaltyAccountRepositoryImpl(prisma);
      const result: PaginatedResult<LoyaltyAccount> = await repository.findWithFilters({}, options);
      expect(result).toEqual({ items: expect.any(Array), total, limit, offset, hasMore });
      expect(result.items).toHaveLength(records.length);
      for (const item of result.items) {
        expect(item).toBeInstanceOf(LoyaltyAccount);
        expect(item.id.getValue()).toBe(record.accountId);
      }
      expect(findMany).toHaveBeenCalledWith({
        where: {},
        take: options?.limit,
        skip: options?.offset,
        orderBy: { updatedAt: "desc" },
      });
      expect(count).toHaveBeenCalledWith({ where: {} });
    },
  );
});

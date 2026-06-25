import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("Loyalty Module E2E API Tests", () => {
  let app: FastifyInstance;
  let adminToken: string;
  let adminId: string;
  let staffToken: string;
  let customerToken: string;
  let customerId: string;
  let staffId: string;
  let passwordHash: string;

  const adminEmail = `loyalty-admin-${randomUUID()}@example.com`;
  const staffEmail = `loyalty-staff-${randomUUID()}@example.com`;
  const customerEmail = `loyalty-customer-${randomUUID()}@example.com`;
  const password = "Password123!";

  beforeAll(async () => {
    app = await createServer();
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    // 1. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "active",
        emailVerified: true,
      },
    });
    adminId = adminUser.id;

    const adminLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: adminEmail, password, ipAddress: "127.0.0.1" },
    });
    adminToken = adminLoginRes.json().data.accessToken;

    // 2. Create Staff User (using valid CUSTOMER_SERVICE role)
    const staffUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: staffEmail,
        passwordHash,
        role: "CUSTOMER_SERVICE",
        status: "active",
        emailVerified: true,
      },
    });
    staffId = staffUser.id;

    const staffLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: staffEmail, password, ipAddress: "127.0.0.1" },
    });
    staffToken = staffLoginRes.json().data.accessToken;

    // 3. Create Customer User
    const customerUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: customerEmail,
        passwordHash,
        role: "CUSTOMER",
        status: "active",
        emailVerified: true,
      },
    });
    customerId = customerUser.id;

    const customerLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: customerEmail, password, ipAddress: "127.0.0.1" },
    });
    customerToken = customerLoginRes.json().data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Access Control & Authorization", () => {
    it("should restrict admin-only endpoints to admin users", async () => {
      // Create Program - Guest
      const guestProgRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/programs",
        payload: {
          name: "E2E Program",
          earnRules: [],
          burnRules: [],
          tiers: [],
        },
      });
      expect(guestProgRes.statusCode).toBe(401);

      // Create Program - Customer
      const customerProgRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/programs",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          name: "E2E Program",
          earnRules: [],
          burnRules: [],
          tiers: [],
        },
      });
      expect(customerProgRes.statusCode).toBe(403);

      // Create Program - Staff
      const staffProgRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/programs",
        headers: { authorization: `Bearer ${staffToken}` },
        payload: {
          name: "E2E Program",
          earnRules: [],
          burnRules: [],
          tiers: [],
        },
      });
      expect(staffProgRes.statusCode).toBe(403);

      // Adjust Points - Staff (Admin only)
      const staffAdjustRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/points/adjust",
        headers: { authorization: `Bearer ${staffToken}` },
        payload: {
          userId: customerId,
          points: 10,
          isAddition: true,
          reason: "Staff adjustment attempt",
          createdBy: staffId,
        },
      });
      expect(staffAdjustRes.statusCode).toBe(403);
    });

    it("should restrict staff-only endpoints to staff/admin users", async () => {
      // Award Points - Customer (fails)
      const customerAwardRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/points/award",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          userId: customerId,
          points: 50,
          reason: "CUSTOMER",
        },
      });
      expect(customerAwardRes.statusCode).toBe(403);
    });
  });

  describe("Core Loyalty E2E Flows", () => {
    it("should complete a full lifecycle: get account, award, redeem, adjust, and list transactions", async () => {
      // 1. Create a program as admin
      const createProgRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/programs",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: "Core Loyalty Program",
          earnRules: [
            { type: "per_dollar", points: 1, minPurchase: 1 },
          ],
          burnRules: [
            { type: "discount", pointsRequired: 10, value: 1 },
          ],
          tiers: [
            { name: "Silver Tier", minPoints: 100, benefits: ["Free Shipping"] },
          ],
        },
      });
      expect(createProgRes.statusCode).toBe(201);
      const programId = createProgRes.json().data.id;
      expect(programId).toBeDefined();

      // 2. Retrieve public program listing
      const listProgRes = await app.inject({
        method: "GET",
        url: "/api/v1/loyalty/programs",
      });
      expect(listProgRes.statusCode).toBe(200);
      expect(listProgRes.json().data.length).toBeGreaterThanOrEqual(1);

      // 3. Get customer account. Getting account triggers creation + signup bonus (50 pts default)
      const getAccountRes = await app.inject({
        method: "GET",
        url: `/api/v1/loyalty/account?userId=${customerId}`,
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(getAccountRes.statusCode).toBe(200);
      const accountData = getAccountRes.json().data;
      expect(accountData.userId).toBe(customerId);
      const initialBalance = accountData.currentBalance;
      expect(initialBalance).toBeGreaterThanOrEqual(0);

      // 4. Staff awards points to customer
      const awardRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/points/award",
        headers: { authorization: `Bearer ${staffToken}` },
        payload: {
          userId: customerId,
          points: 100,
          reason: "PURCHASE",
          description: "Awarded from E2E test",
        },
      });
      expect(awardRes.statusCode).toBe(201);
      const awardTx = awardRes.json().data;
      expect(awardTx.points).toBe(100);
      expect(awardTx.type).toBe("EARN");

      // 5. Retrieve customer account to verify updated balance
      const accountAfterAwardRes = await app.inject({
        method: "GET",
        url: `/api/v1/loyalty/account?userId=${customerId}`,
        headers: { authorization: `Bearer ${customerToken}` },
      });
      const balanceAfterAward = accountAfterAwardRes.json().data.currentBalance;
      expect(balanceAfterAward).toBe(initialBalance + 100);

      // 6. Redeem points
      const redeemRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/points/redeem",
        headers: { authorization: `Bearer ${customerToken}` },
        payload: {
          userId: customerId,
          points: 20,
          reason: "DISCOUNT_REDEMPTION",
        },
      });
      expect(redeemRes.statusCode).toBe(201);
      const redeemTx = redeemRes.json().data;
      expect(redeemTx.points).toBe(20);
      expect(redeemTx.type).toBe("REDEEM");
      expect(redeemTx.balanceAfter).toBe(initialBalance + 100 - 20);

      // 7. Admin manually adjusts points (subtraction)
      const adjustRes = await app.inject({
        method: "POST",
        url: "/api/v1/loyalty/points/adjust",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          userId: customerId,
          points: 10,
          isAddition: false,
          reason: "Admin deduction",
          createdBy: adminId,
        },
      });
      expect(adjustRes.statusCode).toBe(200);
      expect(adjustRes.json().data.balanceAfter).toBe(initialBalance + 100 - 20 - 10);

      // 8. Fetch transaction history
      const txHistoryRes = await app.inject({
        method: "GET",
        url: `/api/v1/loyalty/transactions?accountId=${accountData.id}`,
        headers: { authorization: `Bearer ${customerToken}` },
      });
      expect(txHistoryRes.statusCode).toBe(200);
      const transactions = txHistoryRes.json().data;
      expect(transactions.length).toBeGreaterThanOrEqual(4); // Signup, earn, redeem, adjust
    });
  });
});

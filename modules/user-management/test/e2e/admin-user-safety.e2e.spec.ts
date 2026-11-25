import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";

// Admin panel actions must never let an administrator lock themselves (or
// the platform) out of administration.
const prisma = new PrismaClient();
const password = "Password123!";

describe("Admin user-management safety", () => {
  let app: FastifyInstance;
  let adminId: string;
  let adminToken: string;
  let otherAdminId: string;

  const admin = async (email: string) =>
    (
      await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role: "ADMIN",
          status: "active",
          emailVerified: true,
        },
      })
    ).id;

  beforeAll(async () => {
    app = await createServer();
  });

  beforeEach(async () => {
    adminId = await admin("safety-admin@example.com");
    otherAdminId = await admin("safety-other-admin@example.com");
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "safety-admin@example.com", password, ipAddress: "127.0.0.1" },
    });
    adminToken = login.json().data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const call = (method: "PATCH" | "DELETE", url: string, payload?: object) =>
    app.inject({
      method,
      url,
      headers: { authorization: `Bearer ${adminToken}` },
      ...(payload ? { payload } : {}),
    });

  it.each([
    ["delete", () => call("DELETE", `/api/v1/users/${adminId}`)],
    ["demote", () => call("PATCH", `/api/v1/users/${adminId}/role`, { role: "CUSTOMER" })],
    ["block", () => call("PATCH", `/api/v1/users/${adminId}/status`, { status: "blocked" })],
  ])("refuses to %s the acting administrator's own account", async (_label, action) => {
    const res = await action();
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("ADMIN_SAFETY_VIOLATION");
    const self = await prisma.user.findUnique({ where: { id: adminId } });
    expect(self).toMatchObject({ role: "ADMIN", status: "active" });
  });

  it("still allows managing another administrator while one remains", async () => {
    const res = await call("PATCH", `/api/v1/users/${otherAdminId}/role`, { role: "CUSTOMER" });
    expect(res.statusCode).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: otherAdminId } }))?.role).toBe("CUSTOMER");
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("Authentication session security", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const login = async (email: string, password: string) => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password, ipAddress: "127.0.0.1" },
    });
    expect(res.statusCode).toBe(200);
    return res.json().data.accessToken as string;
  };
  const me = (token: string) =>
    app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });

  it("signs out other sessions when the password changes and keeps the current one", async () => {
    const email = "session-security@example.com";
    const password = "Original#Pass1";
    await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 4), emailVerified: true },
    });
    const laptop = await login(email, password);
    const stolen = await login(email, password);
    expect((await me(stolen)).statusCode).toBe(200);

    const change = await app.inject({
      method: "POST",
      url: "/api/v1/auth/change-password",
      headers: { authorization: `Bearer ${laptop}` },
      payload: { currentPassword: password, newPassword: "Changed#Pass2" },
    });
    expect(change.statusCode).toBe(200);

    expect((await me(stolen)).statusCode).toBe(401);
    expect((await me(laptop)).statusCode).toBe(200);
    expect(await prisma.memberSession.count({ where: { user: { email }, isRevoked: false } })).toBe(
      1,
    );
  });

  it("caps password-reset emails per address so they cannot flood an inbox", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/forgot-password",
        payload: { email: "nobody@example.com" },
      });
      statuses.push(res.statusCode);
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

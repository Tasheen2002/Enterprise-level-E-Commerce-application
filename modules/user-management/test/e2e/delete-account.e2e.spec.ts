import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { TokenBlacklistService } from "@modules/user-management/infra/http/security/token-blacklist";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

const prisma = new PrismaClient();

describe("Delete Account E2E API Tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should successfully delete the account when correct password is provided", async () => {
    const userEmail = "delete-success@example.com";
    const userPassword = "Password123!";

    // 1. Register User
    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userEmail,
        password: userPassword,
        firstName: "Delete",
        lastName: "Success",
      },
    });
    expect(registerResponse.statusCode).toBe(201);

    await new Promise((resolve) => setTimeout(resolve, 50));
    const tokens = TokenBlacklistService.__getVerificationTokens();
    let verificationToken: string | undefined;
    for (const [token, entry] of tokens.entries()) {
      if (entry.email === userEmail) {
        verificationToken = token;
        break;
      }
    }

    // Verify email
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      payload: { token: verificationToken },
    });

    // 2. Login to get access token
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: userEmail, password: userPassword, ipAddress: "127.0.0.1" },
    });
    expect(loginRes.statusCode).toBe(200);
    const accessToken = loginRes.json().data.accessToken;

    // Verify user exists in the DB
    const dbUserBefore = await prisma.user.findFirst({
      where: { email: userEmail },
    });
    expect(dbUserBefore).not.toBeNull();

    // 3. Delete account
    const deleteRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/delete-account",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        password: userPassword,
      },
    });

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.json().success).toBe(true);

    // 4. Verify user record is deleted from DB
    const dbUserAfter = await prisma.user.findFirst({
      where: { email: userEmail },
    });
    expect(dbUserAfter).toBeNull();

    // 5. Verify the token is blacklisted
    const isBlacklisted = TokenBlacklistService.isTokenBlacklisted(accessToken);
    expect(isBlacklisted).toBe(true);
  }, 30000);

  it("should fail to delete the account and keep user intact when incorrect password is provided", async () => {
    const userEmail = "delete-fail@example.com";
    const userPassword = "Password123!";

    // 1. Register User
    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userEmail,
        password: userPassword,
        firstName: "Delete",
        lastName: "Fail",
      },
    });
    expect(registerResponse.statusCode).toBe(201);

    await new Promise((resolve) => setTimeout(resolve, 50));
    const tokens = TokenBlacklistService.__getVerificationTokens();
    let verificationToken: string | undefined;
    for (const [token, entry] of tokens.entries()) {
      if (entry.email === userEmail) {
        verificationToken = token;
        break;
      }
    }

    // Verify email
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      payload: { token: verificationToken },
    });

    // 2. Login to get access token
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: userEmail, password: userPassword, ipAddress: "127.0.0.1" },
    });
    expect(loginRes.statusCode).toBe(200);
    const accessToken = loginRes.json().data.accessToken;

    // 3. Try to delete account with wrong password
    const deleteRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/delete-account",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        password: "wrong-password",
      },
    });

    expect(deleteRes.statusCode).not.toBe(200);

    // 4. Verify user record still exists in DB
    const dbUserAfter = await prisma.user.findFirst({
      where: { email: userEmail },
    });
    expect(dbUserAfter).not.toBeNull();

    // 5. Verify the token is NOT blacklisted
    const isBlacklisted = TokenBlacklistService.isTokenBlacklisted(accessToken);
    expect(isBlacklisted).toBe(false);
  }, 30000);
});

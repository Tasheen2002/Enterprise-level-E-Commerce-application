import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { TokenBlacklistService } from "@modules/user-management/infra/http/security/token-blacklist";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import speakeasy from "speakeasy";

const prisma = new PrismaClient();

describe("2FA E2E API Tests", () => {
  let app: FastifyInstance;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  const userEmail = "2fa-test@example.com";
  const userPassword = "Password123!";

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should complete 2FA lifecycle successfully", async () => {
    // 1. Create verified user
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userEmail,
        password: userPassword,
        firstName: "TwoFactor",
        lastName: "Tester",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    const tokens = TokenBlacklistService.__getVerificationTokens();
    let verificationToken: string | undefined;
    for (const [token, entry] of tokens.entries()) {
      if (entry.email === userEmail) {
        verificationToken = token;
        break;
      }
    }

    await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      payload: { token: verificationToken },
    });

    // Login to get access token
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: userEmail, password: userPassword, ipAddress: "127.0.0.1" },
    });

    const loginData = loginRes.json().data;
    accessToken = loginData.accessToken;
    refreshToken = loginData.refreshToken;
    userId = loginData.user.id;

    // --- STEP 1: SETUP 2FA ---
    const setupRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/2fa/setup",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(setupRes.statusCode).toBe(200);
    const setupData = setupRes.json();
    expect(setupData.success).toBe(true);
    expect(setupData.data.secret).toBeDefined();
    expect(setupData.data.qrCodeDataUrl).toBeDefined();

    const stagedSecret = setupData.data.secret;

    // --- STEP 2: ENABLE 2FA ---
    const code = speakeasy.totp({
      secret: stagedSecret,
      encoding: "base32",
    });

    const enableRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/2fa/enable",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { code },
    });

    expect(enableRes.statusCode).toBe(200);
    const enableData = enableRes.json();
    expect(enableData.success).toBe(true);
    expect(enableData.data.backupCodes).toHaveLength(10);

    const backupCodes = enableData.data.backupCodes;

    // --- STEP 3: LOGIN CHALLENGE ---
    // Log in again, should return requires2FA: true
    const loginChallengeRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: userEmail, password: userPassword, ipAddress: "127.0.0.1" },
    });

    expect(loginChallengeRes.statusCode).toBe(200);
    const challengeData = loginChallengeRes.json();
    expect(challengeData.success).toBe(true);
    expect(challengeData.data.kind).toBe("two_factor_required");
    expect(challengeData.data.pendingToken).toBeDefined();

    const pendingToken = challengeData.data.pendingToken;

    // --- STEP 4: VERIFY 2FA LOGIN ---
    const nextCode = speakeasy.totp({
      secret: stagedSecret,
      encoding: "base32",
    });

    const verifyLoginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/2fa/verify",
      payload: {
        pendingToken,
        code: nextCode,
      },
    });

    expect(verifyLoginRes.statusCode).toBe(200);
    const verifiedLoginData = verifyLoginRes.json();
    expect(verifiedLoginData.success).toBe(true);
    expect(verifiedLoginData.data.accessToken).toBeDefined();

    const newAccessToken = verifiedLoginData.data.accessToken;

    // --- STEP 5: REGENERATE BACKUP CODES ---
    const regenRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/2fa/backup-codes/regenerate",
      headers: { authorization: `Bearer ${newAccessToken}` },
      payload: { password: userPassword },
    });

    expect(regenRes.statusCode).toBe(200);
    expect(regenRes.json().success).toBe(true);
    expect(regenRes.json().data.backupCodes).toHaveLength(10);

    // --- STEP 6: DISABLE 2FA ---
    const disableRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/2fa/disable",
      headers: { authorization: `Bearer ${newAccessToken}` },
      payload: { password: userPassword },
    });

    expect(disableRes.statusCode).toBe(200);
    expect(disableRes.json().success).toBe(true);
  }, 30000);
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { TokenBlacklistService } from "@modules/user-management/infra/http/security/token-blacklist";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

const prisma = new PrismaClient();

describe("User Lifecycle E2E API Tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should register, verify email, login, update profile, and logout successfully", async () => {
    const userEmail = "lifecycle@example.com";
    const userPassword = "Password123!";

    // --- STEP 1: REGISTER ---
    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userEmail,
        password: userPassword,
        firstName: "John",
        lastName: "Doe",
      },
    });

    expect(registerResponse.statusCode).toBe(201);
    const registerData = registerResponse.json();
    expect(registerData.success).toBe(true);
    expect(registerData.data.user.email).toBe(userEmail);
    expect(registerData.data.user.emailVerified).toBe(false);

    // Give background verification promise time to execute and write the token
    await new Promise((resolve) => setTimeout(resolve, 50));

    // --- STEP 2: RETRIEVE VERIFICATION TOKEN ---
    const verificationTokens = TokenBlacklistService.__getVerificationTokens();
    let verificationToken: string | undefined;

    for (const [token, entry] of verificationTokens.entries()) {
      if (entry.email === userEmail) {
        verificationToken = token;
        break;
      }
    }

    expect(verificationToken).toBeDefined();

    // --- STEP 3: VERIFY EMAIL ---
    const verifyResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      payload: {
        token: verificationToken,
      },
    });

    expect(verifyResponse.statusCode).toBe(200);
    expect(verifyResponse.json().success).toBe(true);

    // --- STEP 4: LOGIN ---
    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: userEmail,
        password: userPassword,
        ipAddress: "127.0.0.1",
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginData = loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.data.kind).toBe("success");
    expect(loginData.data.accessToken).toBeDefined();
    expect(loginData.data.user.emailVerified).toBe(true);

    const accessToken = loginData.data.accessToken;
    const refreshToken = loginData.data.refreshToken;

    // --- STEP 5: UPDATE PROFILE ---
    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/profile",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        firstName: "John-Updated",
        lastName: "Doe-Updated",
        phone: "+1234567890",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updateData = updateResponse.json();
    expect(updateData.success).toBe(true);
    expect(updateData.data.firstName).toBe("John-Updated");
    expect(updateData.data.lastName).toBe("Doe-Updated");
    expect(updateData.data.phone).toBe("+1234567890");

    // --- STEP 6: LOGOUT ---
    const logoutResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        token: accessToken,
        refreshToken: refreshToken,
      },
    });

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.json().success).toBe(true);

    // --- STEP 7: VERIFY BLACKLIST STATE ---
    const isBlacklisted = TokenBlacklistService.isTokenBlacklisted(accessToken);
    expect(isBlacklisted).toBe(true);
  }, 30000);
});

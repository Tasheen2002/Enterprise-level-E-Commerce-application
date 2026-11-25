import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "@/api/src/server";
import { TokenBlacklistService } from "@modules/user-management/infra/http/security/token-blacklist";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

const prisma = new PrismaClient();

describe("Session Management E2E API Tests", () => {
  let app: FastifyInstance;
  let accessToken: string;
  let refreshToken: string;
  const userEmail = "session-test@example.com";
  const userPassword = "Password123!";

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should list active sessions and revoke a session successfully", async () => {
    // 1. Register User
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userEmail,
        password: userPassword,
        firstName: "Session",
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

    // 2. Login to create a session (rememberMe: true to issue refreshToken and save session)
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: userEmail,
        password: userPassword,
        rememberMe: true,
        ipAddress: "192.168.1.1",
      },
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) E2ETest",
      },
    });

    expect(loginRes.statusCode).toBe(200);
    const loginData = loginRes.json().data;
    accessToken = loginData.accessToken;
    refreshToken = loginData.refreshToken;

    // --- STEP 1: GET ACTIVE SESSIONS ---
    const getSessionsRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me/sessions",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(getSessionsRes.statusCode).toBe(200);
    const sessionsData = getSessionsRes.json();
    expect(sessionsData.success).toBe(true);
    expect(sessionsData.data.length).toBeGreaterThanOrEqual(1);

    // Since this is a fresh database, it will be the only active session
    const activeSession = sessionsData.data[0];

    expect(activeSession).toBeDefined();
    const sessionId = activeSession.id;

    // --- STEP 2: REVOKE SESSION ---
    const revokeRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/me/sessions/${sessionId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(revokeRes.statusCode).toBe(200);
    expect(revokeRes.json().success).toBe(true);

    // --- STEP 3: VERIFY REVOKED SESSION ---
    // Try to refresh token using the revoked refresh token
    const refreshRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: { refreshToken },
    });

    // It should fail because the session/token is revoked
    expect(refreshRes.statusCode).toBe(400); // Or 401 depending on standard error code
  });
});

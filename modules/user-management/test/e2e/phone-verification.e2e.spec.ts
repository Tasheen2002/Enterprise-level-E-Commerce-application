import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer } from "@/api/src/server";
import { TokenBlacklistService } from "@modules/user-management/infra/http/security/token-blacklist";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

// Mock the FirebaseAuthVerifierAdapter
vi.mock("../../infra/security/firebase-auth-verifier.adapter", () => {
  return {
    FirebaseAuthVerifierAdapter: class {
      async verifyIdToken() {
        return {
          email: "google-user@example.com",
          emailVerified: true,
          uid: "firebase-uid-123",
        };
      }
      async verifyPhoneIdToken() {
        return {
          phoneNumber: "+15555555555",
        };
      }
    },
  };
});

describe("Phone Verification E2E API Tests", () => {
  let app: FastifyInstance;
  let accessToken: string;
  const userEmail = "phone-test@example.com";
  const userPassword = "Password123!";

  beforeAll(async () => {
    // Set dummy env variables so the container instantiates the adapter instead of the stub
    process.env.FIREBASE_ADMIN_PROJECT_ID = "mock-project";
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = "mock-email@example.com";
    process.env.FIREBASE_ADMIN_PRIVATE_KEY = "mock-private-key";

    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  });

  it("should verify phone number successfully using a mocked Firebase ID token", async () => {
    // 1. Register User
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userEmail,
        password: userPassword,
        firstName: "Phone",
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

    // 2. Login to get access token
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: userEmail, password: userPassword, ipAddress: "127.0.0.1" },
    });

    accessToken = loginRes.json().data.accessToken;

    // --- STEP 1: VERIFY PHONE ---
    const verifyPhoneRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-phone",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        idToken: "mock-firebase-id-token",
      },
    });

    expect(verifyPhoneRes.statusCode).toBe(200);
    const verifyPhoneData = verifyPhoneRes.json();
    expect(verifyPhoneData.success).toBe(true);
    expect(verifyPhoneData.data.phoneNumber).toBe("+15555555555");
  }, 30000);
});

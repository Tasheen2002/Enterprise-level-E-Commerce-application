import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

// Mock the FirebaseAuthVerifierAdapter to dynamically return fields based on the mock token
vi.mock("../../infra/security/firebase-auth-verifier.adapter", () => {
  return {
    FirebaseAuthVerifierAdapter: class {
      async verifyIdToken(idToken: string) {
        if (idToken.startsWith("token-")) {
          const email = idToken.substring(6); // extract email from token
          const name = email.split("@")[0].replace(/-/g, " ");
          const emailVerified = !email.includes("unverified");
          return {
            email,
            emailVerified,
            uid: `firebase-uid-${email}`,
            name,
            picture: `https://example.com/${email}.jpg`,
          };
        }
        throw new Error("Invalid mock idToken");
      }
      async verifyPhoneIdToken() {
        return {
          phoneNumber: "+15555555555",
        };
      }
    },
  };
});

const prisma = new PrismaClient();

describe("Google Authentication E2E API Tests", () => {
  let app: FastifyInstance;

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

  it("should auto-create a user on Google Login if the email does not exist", async () => {
    const userEmail = "new-google-user@example.com";
    const idToken = `token-${userEmail}`;

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google",
      payload: { idToken },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();

    // Verify DB user properties
    const dbUser = await prisma.user.findFirst({
      where: { email: userEmail },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.emailVerified).toBe(true); // Since our mock returns emailVerified = true
    expect(dbUser?.firstName).toBe("new");
    expect(dbUser?.lastName).toBe("google user");
    expect(dbUser?.isGuest).toBe(false);
  });

  it("should log in successfully and map to existing account if email already exists", async () => {
    const userEmail = "existing-google-user@example.com";
    const idToken = `token-${userEmail}`;

    // Seed the user manually first
    const createdUser = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash: "dummyhash",
        firstName: "OriginalFirst",
        lastName: "OriginalLast",
        emailVerified: false,
        isGuest: false,
      },
    });

    // Make Google Login call
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google",
      payload: { idToken },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();

    // Verify DB user is same record and details are intact/updated appropriately
    const allMatchingUsers = await prisma.user.findMany({
      where: { email: userEmail },
    });
    expect(allMatchingUsers.length).toBe(1); // No duplicates
    expect(allMatchingUsers[0].id).toBe(createdUser.id);
  });

  it("should not mark email as verified if Google token asserts emailVerified as false", async () => {
    const userEmail = "unverified-google-user@example.com";
    const idToken = `token-${userEmail}`; // "unverified" is in email, so mock emailVerified will be false

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google",
      payload: { idToken },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);

    const dbUser = await prisma.user.findFirst({
      where: { email: userEmail },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.emailVerified).toBe(false);
  });
});

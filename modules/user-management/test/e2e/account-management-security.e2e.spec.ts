import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";
import { NodemailerEmailService } from "@modules/user-management/infra/security/nodemailer-email.adapter";
import { TokenBlacklistService } from "@modules/user-management/infra/http/security/token-blacklist";

const prisma = new PrismaClient();
const password = "Account#Pass1";

describe("Account management security", () => {
  let app: FastifyInstance;
  let sent: Array<{ kind: string; to: string; token?: string }>;

  beforeAll(async () => {
    app = await createServer();
  });

  beforeEach(() => {
    sent = [];
    vi.spyOn(NodemailerEmailService.prototype, "sendVerificationEmail").mockImplementation(
      async (to: string, token: string) => {
        sent.push({ kind: "verify", to, token });
      },
    );
    vi.spyOn(NodemailerEmailService.prototype, "sendEmail").mockImplementation(async (options) => {
      sent.push({ kind: "notice", to: options.to });
    });
    vi.spyOn(NodemailerEmailService.prototype, "sendInvitationEmail").mockImplementation(
      async () => {},
    );
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  const account = async (email: string, role: "CUSTOMER" | "ADMIN" = "CUSTOMER") => {
    await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 4), role, emailVerified: true },
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password, ipAddress: "127.0.0.1" },
    });
    return res.json().data.accessToken as string;
  };
  const auth = (token: string) => ({ authorization: `Bearer ${token}` });
  const verify = (token: string) =>
    app.inject({ method: "POST", url: "/api/v1/auth/verify-email", payload: { token } });

  describe("email change requires proof of the new address", () => {
    it("changes the email only after the link sent to the new address is opened", async () => {
      const token = await account("owner@example.com");
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/change-email",
        headers: auth(token),
        payload: { newEmail: "owner-new@example.com", password },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.action).toBe("email_change_requested");

      const user = await prisma.user.findUnique({ where: { email: "owner@example.com" } });
      expect(user?.emailVerified).toBe(true); // unchanged until confirmed
      const link = sent.find((m) => m.kind === "verify");
      expect(link?.to).toBe("owner-new@example.com");
      expect(sent.some((m) => m.kind === "notice" && m.to === "owner@example.com")).toBe(true);

      expect((await verify(link!.token!)).statusCode).toBe(200);
      const changed = await prisma.user.findUnique({ where: { id: user!.id } });
      expect(changed).toMatchObject({ email: "owner-new@example.com", emailVerified: true });
    });

    it("never lets a token for one address verify a different address", async () => {
      // Attacker keeps a verification link for their own address, then moves
      // the account onto a victim's address with the old one-step flow.
      const user = await prisma.user.create({
        data: {
          email: "victim@example.com",
          passwordHash: await bcrypt.hash(password, 4),
          emailVerified: false,
        },
      });
      TokenBlacklistService.storeVerificationToken(
        "stale-token-for-attacker-address",
        user.id,
        "attacker@example.com",
      );

      await verify("stale-token-for-attacker-address");
      const after = await prisma.user.findUnique({ where: { id: user.id } });
      expect(after?.email === "victim@example.com" && after.emailVerified).toBe(false);
    });
  });

  it("never returns the invitation token to the inviting administrator", async () => {
    const admin = await account("inviter@example.com", "ADMIN");
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/admin/invitations",
      headers: auth(admin),
      payload: { email: "new-staff@example.com", role: "CUSTOMER_SERVICE" },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.stringify(res.json())).not.toMatch(/"token"/);
  });

  describe("payment methods are created by the payment processor", () => {
    it("refuses cards on the generic route and ignores client processor references", async () => {
      const token = await account("wallet-owner@example.com");
      const card = await app.inject({
        method: "POST",
        url: "/api/v1/users/me/payment-methods",
        headers: auth(token),
        payload: { type: "card", brand: "visa", last4: "4242", expMonth: 1, expYear: 2099 },
      });
      expect(card.statusCode).toBe(400);

      const wallet = await app.inject({
        method: "POST",
        url: "/api/v1/users/me/payment-methods",
        headers: auth(token),
        payload: { type: "wallet", providerRef: "pm_someone_else" },
      });
      expect(wallet.statusCode).toBe(201);
      const stored = await prisma.paymentMethod.findFirst({
        where: { user: { email: "wallet-owner@example.com" } },
      });
      expect(stored?.providerRef).toBeNull();
    });
  });

  it("only accepts https avatar URLs", async () => {
    const token = await account("avatar@example.com");
    const update = (avatarUrl: string) =>
      app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        headers: auth(token),
        payload: { avatarUrl },
      });
    for (const unsafe of ["javascript:alert(1)", "http://tracker.example/pixel.png"]) {
      expect((await update(unsafe)).statusCode, unsafe).toBe(400);
    }
    expect((await update("https://ik.imagekit.io/example/avatar.png")).statusCode).toBe(200);
  });
});

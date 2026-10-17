import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import authPlugin from "../../src/plugins/auth";
import { authenticate } from "../../src/shared/middleware/authenticate.middleware";
import { JwtService } from "../../../../modules/user-management/infra/http/security/jwt.service";
import { TokenBlacklistService } from "../../../../modules/user-management/infra/http/security/token-blacklist";
import { requireTestDatabase } from "../../../../scripts/testing/database-safety";
import { AuthenticationService } from "../../../../modules/user-management/application/services/authentication.service";
import { NodemailerEmailService } from "../../../../modules/user-management/infra/security/nodemailer-email.adapter";

const secret = "synthetic-unit-test-secret";
const claims = {
  userId: randomUUID(),
  email: "test@example.com",
  role: "CUSTOMER",
  sessionId: randomUUID(),
};
afterEach(() => vi.unstubAllEnvs());

describe("access authentication boundary", () => {
  it("persists logout revocation using the signed access session", async () => {
    const service = new JwtService({ accessTokenSecret: secret, refreshTokenSecret: secret });
    const revoke = vi.fn().mockResolvedValue(undefined);
    const auth = new AuthenticationService(
      {} as never,
      {} as never,
      service,
      {} as never,
      {} as never,
      {} as never,
      { revoke } as never,
    );
    const token = service.signAccess(claims);
    await auth.logout(randomUUID(), token);
    expect(revoke).not.toHaveBeenCalled();
    await auth.logout(claims.userId, token);
    expect(revoke).toHaveBeenCalledWith(claims.sessionId);
  });

  it("builds email links from the primary configured frontend origin", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("FRONTEND_URL", " https://shop.example.com/, https://admin.example.com ");
    const mailer = new NodemailerEmailService();
    const send = vi.spyOn(mailer, "sendEmail").mockResolvedValue(undefined);
    await mailer.sendPasswordResetEmail("test@example.com", "synthetic&token");
    expect(send.mock.calls[0][0].text).toContain(
      "https://shop.example.com/reset-password?token=synthetic%26token",
    );
    await mailer.sendVerificationEmail("test@example.com", "synthetic");
    expect(send.mock.calls[1][0].text).toContain(
      "https://shop.example.com/verify-email?token=synthetic",
    );
  });
  it("rejects wrong token kinds, malformed claims and blacklisted tokens", async () => {
    vi.stubEnv("JWT_SECRET", secret);
    const app = Fastify();
    await app.register(authPlugin);
    app.get("/private", { preHandler: authenticate }, async () => ({ ok: true }));
    const service = new JwtService({ accessTokenSecret: secret, refreshTokenSecret: secret });
    try {
      const access = service.signAccess(claims);
      const send = (token: string) =>
        app.inject({ url: "/private", headers: { authorization: `Bearer ${token}` } });
      expect((await send(access)).statusCode).toBe(200);
      for (const token of [
        service.signRefresh(claims),
        service.signTwoFactorPending({ ...claims, rememberMe: false }),
        jwt.sign({ type: "access" }, secret),
      ]) {
        expect((await send(token)).statusCode).toBe(401);
      }
      TokenBlacklistService.blacklistToken(access);
      expect((await send(access)).statusCode).toBe(401);
      expect(() => service.verifyRefresh(service.signAccess(claims))).toThrow();
      expect(() => service.verifyAccess(service.signRefresh(claims))).toThrow();
    } finally {
      await app.close();
    }
  });

  it("checks persisted session state for every protected application request", async () => {
    vi.stubEnv("JWT_SECRET", secret);
    const app = Fastify();
    const findFirst = vi.fn().mockResolvedValue({ id: claims.sessionId });
    app.decorate("prisma", { memberSession: { findFirst } } as never);
    await app.register(authPlugin);
    app.get("/private", { preHandler: authenticate }, async () => ({ ok: true }));
    const service = new JwtService({ accessTokenSecret: secret, refreshTokenSecret: secret });
    const headers = { authorization: `Bearer ${service.signAccess(claims)}` };
    try {
      expect((await app.inject({ url: "/private", headers })).statusCode).toBe(200);
      expect(findFirst.mock.calls[0][0].where).toMatchObject({
        id: claims.sessionId,
        userId: claims.userId,
        isRevoked: false,
        user: { status: "active", role: "CUSTOMER" },
      });
      findFirst.mockResolvedValue(null);
      expect((await app.inject({ url: "/private", headers })).statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});

describe("database cleanup safety", () => {
  const env = {
    TEST_DATABASE_URL: "postgresql://test:test@localhost/ecommerce_test",
    ALLOW_DATABASE_TEST_CLEANUP: "1",
  };
  it("requires an explicit dedicated test URL and destructive cleanup opt-in", () => {
    expect(requireTestDatabase(env)).toContain("ecommerce_test");
    for (const unsafe of [
      {},
      { DATABASE_URL: env.TEST_DATABASE_URL },
      { ...env, ALLOW_DATABASE_TEST_CLEANUP: "0" },
      { ...env, TEST_DATABASE_URL: "postgresql://test:test@localhost/ecommerce_dev" },
      { ...env, TEST_DATABASE_URL: "postgresql://test:test@remote.invalid/ecommerce_test" },
    ]) {
      expect(() => requireTestDatabase(unsafe)).toThrow();
    }
  });
});

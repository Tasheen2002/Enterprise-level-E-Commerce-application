import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import authPlugin from "../../src/plugins/auth";
import errorPlugin from "../../src/plugins/error";
import { authenticate } from "../../src/shared/middleware/authenticate.middleware";
import {
  optionalAuth,
  authenticateUser,
  requireAdmin,
} from "../../src/shared/middleware/optional-auth.middleware";
import {
  requireRole,
  hasRole,
  RolePermissions,
  ADMIN_ROLES,
  STAFF_ROLES,
  CUSTOMER_CARE_ROLES,
  VENDOR_ROLES,
  AUTHENTICATED_ROLES,
} from "../../src/shared/middleware/role-authorization.middleware";
import { JwtService } from "../../../../modules/user-management/infra/http/security/jwt.service";
import { TokenBlacklistService } from "../../../../modules/user-management/infra/http/security/token-blacklist";
import type { FastifyRequest } from "fastify";
import { isUnauthorizedError } from "../../src/shared/http/authentication";

const secret = "synthetic-access-boundary-secret";
const claims = () => ({
  userId: randomUUID(),
  email: "member@example.test",
  role: "CUSTOMER",
  sessionId: randomUUID(),
});
const signer = () => new JwtService({ accessTokenSecret: secret, refreshTokenSecret: secret });
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function application() {
  vi.stubEnv("JWT_SECRET", secret);
  const app = Fastify();
  const findFirst = vi.fn().mockResolvedValue({ id: "session" });
  app.decorate("prisma", { memberSession: { findFirst } } as never);
  await app.register(authPlugin);
  await app.register(errorPlugin);
  app.get("/required", { preHandler: authenticate }, async (request) => ({
    userId: request.user?.userId,
  }));
  app.get("/optional", { preHandler: optionalAuth }, async (request) => ({
    userId: request.user?.userId ?? null,
  }));
  return { app, findFirst };
}

describe("required and optional authentication transport", () => {
  it("rejects missing auth configuration and supports configured stateless verifier compatibility", async () => {
    vi.stubEnv("JWT_SECRET", undefined);
    const missing = Fastify();
    try {
      await expect(missing.register(authPlugin)).rejects.toThrow(
        "JWT_SECRET environment variable is required",
      );
    } finally {
      await missing.close();
    }
    const app = Fastify();
    app.decorate("config", { JWT_SECRET: secret, JWT_EXPIRES_IN: "1m" } as never);
    await app.register(authPlugin);
    app.get("/stateless", { preHandler: authenticate }, async (request) => request.user);
    const user = claims();
    try {
      const defaultRole = app.signToken({ userId: user.userId, email: user.email });
      expect(app.verifyToken(defaultRole).role).toBe("CUSTOMER");
      const admin = app.signToken({ ...user, role: "ADMIN" });
      expect(app.verifyToken(admin).role).toBe("ADMIN");
      expect(
        (
          await app.inject({
            url: "/stateless",
            headers: { authorization: `Bearer ${defaultRole}` },
          })
        ).statusCode,
      ).toBe(200);
    } finally {
      await app.close();
    }
  });
  it.each(["Bearer ", "bearer ", "BEARER ", "bEaReR ", "Bearer   "])(
    "accepts HTTP bearer scheme form %s",
    async (prefix) => {
      const { app, findFirst } = await application();
      const user = claims();
      try {
        const response = await app.inject({
          url: "/required",
          headers: { authorization: prefix + signer().signAccess(user) },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ userId: user.userId });
        expect(findFirst).toHaveBeenCalledTimes(1);
        expect(findFirst.mock.calls[0][0]).toEqual({
          where: {
            id: user.sessionId,
            userId: user.userId,
            isRevoked: false,
            expiresAt: { gt: expect.any(Date) },
            user: { status: "active", role: "CUSTOMER" },
          },
          select: { id: true },
        });
      } finally {
        await app.close();
      }
    },
  );
  it.each([undefined, "Basic credentials", "Bearer", "Bearer ", "Bearer invalid", "Bearer a b"])(
    "rejects missing/malformed credentials %s with a challenge",
    async (authorization) => {
      const { app, findFirst } = await application();
      try {
        const response = await app.inject({
          url: "/required",
          headers: authorization === undefined ? {} : { authorization },
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual({
          success: false,
          statusCode: 401,
          message: "Unauthorized",
        });
        expect(response.headers["www-authenticate"]).toMatch(/^Bearer\b/);
        expect(findFirst).not.toHaveBeenCalled();
      } finally {
        await app.close();
      }
    },
  );
  it.each([
    "refresh",
    "pending",
    "expired",
    "wrong-key",
    "wrong-algorithm",
    "malformed-claims",
    "no-session",
    "blacklisted",
  ])("rejects %s credentials before persistence access", async (kind) => {
    const { app, findFirst } = await application();
    const user = claims();
    const service = signer();
    let token = service.signAccess(user);
    if (kind === "refresh") token = service.signRefresh(user);
    if (kind === "pending")
      token = service.signTwoFactorPending({
        userId: user.userId,
        email: user.email,
        rememberMe: false,
      });
    if (kind === "expired")
      token = jwt.sign({ ...user, type: "access" }, secret, { expiresIn: -1 });
    if (kind === "wrong-key")
      token = jwt.sign({ ...user, type: "access" }, "synthetic-other-key", { expiresIn: 60 });
    if (kind === "wrong-algorithm")
      token = jwt.sign({ ...user, type: "access" }, secret, { algorithm: "HS384", expiresIn: 60 });
    if (kind === "malformed-claims")
      token = jwt.sign({ type: "access" }, secret, { expiresIn: 60 });
    if (kind === "no-session")
      token = service.signAccess({ userId: user.userId, email: user.email, role: user.role });
    if (kind === "blacklisted") TokenBlacklistService.blacklistToken(token, 1000);
    try {
      const response = await app.inject({
        url: "/required",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(401);
      expect(findFirst).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
  it("keeps optional anonymous/invalid requests anonymous and a valid identity scoped to one request", async () => {
    const { app } = await application();
    const user = claims();
    try {
      expect(
        (
          await app.inject({
            url: "/optional",
            headers: { authorization: `Bearer ${signer().signAccess(user)}` },
          })
        ).json(),
      ).toEqual({ userId: user.userId });
      for (const headers of [{}, { authorization: "Bearer invalid" }]) {
        const response = await app.inject({ url: "/optional", headers });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ userId: null });
      }
    } finally {
      await app.close();
    }
  });
  it.each(["required", "optional"])(
    "checks current session state again on %s requests",
    async (path) => {
      const { app, findFirst } = await application();
      const headers = { authorization: `Bearer ${signer().signAccess(claims())}` };
      try {
        expect((await app.inject({ url: `/${path}`, headers })).statusCode).toBe(200);
        findFirst.mockResolvedValue(null);
        const next = await app.inject({ url: `/${path}`, headers });
        expect(next.statusCode).toBe(path === "required" ? 401 : 200);
        if (path === "optional") expect(next.json()).toEqual({ userId: null });
        expect(findFirst).toHaveBeenCalledTimes(2);
      } finally {
        await app.close();
      }
    },
  );
  it.each(["required", "optional"])(
    "preserves persistence failures on %s requests as redacted server failures",
    async (path) => {
      const { app, findFirst } = await application();
      findFirst.mockRejectedValue(new Error("synthetic-private-db-detail"));
      try {
        const response = await app.inject({
          url: `/${path}`,
          headers: { authorization: `Bearer ${signer().signAccess(claims())}` },
        });
        expect(response.statusCode).toBe(500);
        expect(response.body).not.toContain("synthetic-private");
        expect(response.json().code).toBe("INTERNAL_ERROR");
      } finally {
        await app.close();
      }
    },
  );
});

describe("shared unauthorized classification", () => {
  it.each([
    { label: "undefined", error: undefined, expected: false },
    { label: "null", error: null, expected: false },
    { label: "primitive", error: "401", expected: false },
    { label: "no status", error: new Error("Synthetic outage"), expected: false },
    { label: "string status", error: { statusCode: "401" }, expected: false },
    { label: "server status", error: { statusCode: 503 }, expected: false },
    { label: "credential status", error: { statusCode: 401 }, expected: true },
  ])(
    "classifies $label without converting infrastructure errors to anonymous access",
    ({ error, expected }) => {
      expect(isUnauthorizedError(error)).toBe(expected);
    },
  );
});

describe("role authorization policies", () => {
  const allRoles = [
    "ADMIN",
    "INVENTORY_STAFF",
    "CUSTOMER_SERVICE",
    "ANALYST",
    "VENDOR",
    "CUSTOMER",
  ];
  const policies = [
    { name: "ADMIN_ONLY", handler: RolePermissions.ADMIN_ONLY, expected: ["ADMIN"] },
    {
      name: "STAFF_LEVEL",
      handler: RolePermissions.STAFF_LEVEL,
      expected: ["ADMIN", "INVENTORY_STAFF", "CUSTOMER_SERVICE", "ANALYST"],
    },
    {
      name: "CUSTOMER_CARE",
      handler: RolePermissions.CUSTOMER_CARE,
      expected: ["ADMIN", "CUSTOMER_SERVICE"],
    },
    {
      name: "VENDOR_ACCESS",
      handler: RolePermissions.VENDOR_ACCESS,
      expected: ["ADMIN", "VENDOR"],
    },
    { name: "AUTHENTICATED", handler: RolePermissions.AUTHENTICATED, expected: allRoles },
  ];
  it.each(policies.flatMap((policy) => allRoles.map((role) => ({ ...policy, role }))))(
    "applies $name to $role",
    async ({ handler, expected, role }) => {
      const { app } = await application();
      app.get("/role", { preHandler: [authenticate, handler] }, async () => ({ allowed: true }));
      try {
        const response = await app.inject({
          url: "/role",
          headers: { authorization: `Bearer ${signer().signAccess({ ...claims(), role })}` },
        });
        expect(response.statusCode).toBe(expected.includes(role) ? 200 : 403);
      } finally {
        await app.close();
      }
    },
  );
  it.each([undefined, {}, { role: "unknown" }, { role: "customer" }])(
    "denies missing/unsupported role state %j",
    async (user) => {
      const app = Fastify();
      app.decorateRequest("user", null);
      app.addHook("preHandler", async (request) => {
        request.user = user as never;
      });
      app.get("/role", { preHandler: requireRole(["ADMIN"]) }, async () => ({ allowed: true }));
      try {
        const response = await app.inject("/role");
        expect(response.statusCode).toBe(user ? 403 : 401);
        expect(hasRole({ user } as FastifyRequest, ["ADMIN"])).toBe(false);
      } finally {
        await app.close();
      }
    },
  );
  it("captures an allowlist without permitting later caller mutation to widen access", async () => {
    const allowed = ["ADMIN"];
    const guard = requireRole(allowed);
    allowed.push("CUSTOMER");
    const { app } = await application();
    app.get("/role", { preHandler: [authenticate, guard] }, async () => ({}));
    try {
      expect(
        (
          await app.inject({
            url: "/role",
            headers: { authorization: `Bearer ${signer().signAccess(claims())}` },
          })
        ).statusCode,
      ).toBe(403);
    } finally {
      await app.close();
    }
  });
  it.each([
    { name: "admin", list: ADMIN_ROLES },
    { name: "staff", list: STAFF_ROLES },
    { name: "care", list: CUSTOMER_CARE_ROLES },
    { name: "vendor", list: VENDOR_ROLES },
    { name: "authenticated", list: AUTHENTICATED_ROLES },
  ])("keeps the $name role catalog immutable", ({ list }) => {
    const original = list[0];
    try {
      expect(Reflect.set(list, 0, "CUSTOMER")).toBe(false);
    } finally {
      Reflect.set(list, 0, original);
    }
  });
  it("retains facade identity and common role-query behavior", () => {
    expect(authenticateUser).toBe(authenticate);
    expect(requireAdmin).toBe(RolePermissions.ADMIN_ONLY);
    expect(hasRole({ user: { role: "ADMIN" } } as FastifyRequest, ["ADMIN"])).toBe(true);
    expect(hasRole({ user: { role: "CUSTOMER" } } as FastifyRequest, ["ADMIN"])).toBe(false);
  });
});

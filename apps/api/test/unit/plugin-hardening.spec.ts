import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import configPlugin, { envSchema } from "../../src/plugins/config";
import securityPlugin from "../../src/plugins/security";
import swaggerPlugin from "../../src/plugins/swagger";
import errorPlugin from "../../src/plugins/error";
import authPlugin from "../../src/plugins/auth";
import { authenticate } from "../../src/shared/middleware/authenticate.middleware";
import { JwtService } from "../../../../modules/user-management/infra/http/security/jwt.service";

const secret = "synthetic-plugin-hardening-secret-0123456789";
const environment = (overrides: Record<string, string> = {}) => ({
  DATABASE_URL: "postgresql://synthetic:synthetic@localhost/synthetic",
  JWT_SECRET: secret,
  NODE_ENV: "test",
  FRONTEND_URL: "https://shop.example.test,https://admin.example.test",
  ...overrides,
});

const apps: FastifyInstance[] = [];
const create = () => {
  const app = Fastify();
  apps.push(app);
  return app;
};
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function withConfig(overrides: Record<string, string> = {}) {
  const app = create();
  await app.register(configPlugin, { environment: environment(overrides) });
  return app;
}

const cspDirectives = (header: unknown) =>
  Object.fromEntries(
    String(header)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...values] = part.split(/\s+/);
        return [name, values];
      }),
  ) as Record<string, string[]>;

describe("security plugin (CORS/Helmet)", () => {
  it("requires validated configuration instead of a drifted fallback origin list", async () => {
    const app = create();
    await expect(app.register(securityPlugin)).rejects.toThrow(/config/);
  });

  it("allows exactly the configured origins with credentials", async () => {
    const app = await withConfig();
    await app.register(securityPlugin);
    app.get("/probe", async () => ({ ok: true }));
    const allowed = await app.inject({
      url: "/probe",
      headers: { origin: "https://admin.example.test" },
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe("https://admin.example.test");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
    for (const origin of ["http://localhost:3001", "http://127.0.0.1:3002", "https://evil.test"]) {
      const denied = await app.inject({ url: "/probe", headers: { origin } });
      expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
    }
  });

  it("exposes rate-limit and authentication challenge headers to browser clients", async () => {
    const app = await withConfig();
    await app.register(securityPlugin);
    app.get("/probe", async () => ({ ok: true }));
    const response = await app.inject({
      url: "/probe",
      headers: { origin: "https://shop.example.test" },
    });
    const exposed = String(response.headers["access-control-expose-headers"] ?? "")
      .split(",")
      .map((header) => header.trim().toLowerCase());
    expect(exposed).toEqual(
      expect.arrayContaining([
        "retry-after",
        "www-authenticate",
        "x-ratelimit-limit",
        "x-ratelimit-remaining",
        "x-ratelimit-reset",
      ]),
    );
  });

  it("does not allow inline scripts in the global content security policy", async () => {
    const app = await withConfig();
    await app.register(securityPlugin);
    app.get("/probe", async () => ({ ok: true }));
    const csp = cspDirectives((await app.inject("/probe")).headers["content-security-policy"]);
    expect(csp["script-src"]).toEqual(["'self'"]);
    expect(csp["script-src-attr"]).toEqual(["'none'"]);
    expect(csp["object-src"]).toEqual(["'none'"]);
  });
});

describe("swagger plugin", () => {
  async function documented(overrides: Record<string, string> = {}) {
    const app = await withConfig(overrides);
    await app.register(securityPlugin);
    await app.register(swaggerPlugin);
    app.get("/probe", { schema: { summary: "probe" } }, async () => ({ ok: true }));
    await app.ready();
    return app;
  }

  it("serves documentation with a strict CSP when enabled", async () => {
    const app = await documented({ API_DOCS_ENABLED: "true" });
    const page = await app.inject("/docs/");
    expect(page.statusCode).toBe(200);
    const csp = cspDirectives(page.headers["content-security-policy"]);
    expect(csp["script-src"]).not.toContain("'unsafe-inline'");
    expect(csp["script-src-attr"]).toEqual(["'none'"]);
    const spec = await app.inject("/docs/json");
    expect(spec.statusCode).toBe(200);
    expect(spec.json().info.title).toBe("Slipperze API");
  });

  it("does not publish documentation routes in production unless enabled explicitly", async () => {
    const app = await documented({ NODE_ENV: "production" });
    expect(app.config.API_DOCS_ENABLED).toBe(false);
    for (const url of ["/docs", "/docs/", "/docs/json", "/docs/static/swagger-initializer.js"])
      expect((await app.inject(url)).statusCode).toBe(404);
    expect(app.swagger().info.title).toBe("Slipperze API");
    const enabled = await documented({ NODE_ENV: "production", API_DOCS_ENABLED: "true" });
    expect((await enabled.inject("/docs/json")).statusCode).toBe(200);
  });

  it("requires validated configuration", async () => {
    const app = create();
    await expect(app.register(swaggerPlugin)).rejects.toThrow(/config/);
  });
});

describe("error plugin not-found envelope", () => {
  it("uses the shared error envelope and does not reflect the query string", async () => {
    const app = create();
    await app.register(errorPlugin);
    const response = await app.inject("/missing/path?token=private-reset-token");
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      success: false,
      statusCode: 404,
      message: "Route GET:/missing/path not found",
      code: "ROUTE_NOT_FOUND",
    });
    expect(response.body).not.toContain("private-reset-token");
  });
});

describe("authentication plugin dependencies", () => {
  const claims = () => ({
    userId: randomUUID(),
    email: "member@example.test",
    role: "CUSTOMER",
    sessionId: randomUUID(),
  });

  it("does not fall back to an unvalidated ambient JWT secret", async () => {
    vi.stubEnv("JWT_SECRET", secret);
    const app = create();
    app.decorate("prisma", { memberSession: { findFirst: vi.fn() } } as never);
    await expect(app.register(authPlugin)).rejects.toThrow(/config/);
  });

  it("refuses to register without persisted session validation", async () => {
    const app = await withConfig();
    await expect(app.register(authPlugin)).rejects.toThrow(/prisma/);
  });

  it("does not expose a session-less token signer", async () => {
    const app = await withConfig();
    app.decorate("prisma", { memberSession: { findFirst: vi.fn() } } as never);
    await app.register(authPlugin);
    expect(app.hasDecorator("signToken")).toBe(false);
  });

  it("rejects tokens without a session even when the session store would match", async () => {
    const app = await withConfig();
    const findFirst = vi.fn().mockResolvedValue({ id: "session" });
    app.decorate("prisma", { memberSession: { findFirst } } as never);
    await app.register(authPlugin);
    app.get("/private", { preHandler: authenticate }, async () => ({ ok: true }));
    const signer = new JwtService({ accessTokenSecret: secret, refreshTokenSecret: secret });
    const { sessionId: _omitted, ...sessionless } = claims();
    const response = await app.inject({
      url: "/private",
      headers: { authorization: `Bearer ${signer.signAccess(sessionless)}` },
    });
    expect(response.statusCode).toBe(401);
    expect(findFirst).not.toHaveBeenCalled();
    const valid = await app.inject({
      url: "/private",
      headers: { authorization: `Bearer ${signer.signAccess(claims())}` },
    });
    expect(valid.statusCode).toBe(200);
  });
});

describe("configuration hardening", () => {
  const base = environment();

  it.each(["true", "*", "1", "2", "yes", "10.0.0.0/33", "::1/129", "localhost", "127.0.0"])(
    "rejects TRUST_PROXY entry %j that is not an address, CIDR range or proxy-addr name",
    (TRUST_PROXY) => {
      const result = envSchema.safeParse({ ...base, TRUST_PROXY });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].path).toEqual(["TRUST_PROXY"]);
    },
  );

  it("accepts addresses, CIDR ranges and proxy-addr names for TRUST_PROXY", () => {
    expect(
      envSchema.parse({
        ...base,
        TRUST_PROXY: "10.0.0.1, 10.0.0.0/8, ::1, fd00::/8, loopback, linklocal, uniquelocal",
      }).TRUST_PROXY,
    ).toEqual([
      "10.0.0.1",
      "10.0.0.0/8",
      "::1",
      "fd00::/8",
      "loopback",
      "linklocal",
      "uniquelocal",
    ]);
  });

  it("requires an HS256 secret of at least 256 bits in production", () => {
    const short = "x".repeat(31);
    expect(
      envSchema.safeParse({ ...base, NODE_ENV: "production", JWT_SECRET: short }).success,
    ).toBe(false);
    expect(
      envSchema.safeParse({ ...base, NODE_ENV: "production", JWT_SECRET: "x".repeat(32) }).success,
    ).toBe(true);
    expect(
      envSchema.safeParse({ ...base, NODE_ENV: "development", JWT_SECRET: short }).success,
    ).toBe(true);
  });

  it.each([
    ["development", undefined, true],
    ["test", undefined, true],
    ["production", undefined, false],
    ["production", "true", true],
    ["development", "false", false],
  ] as const)(
    "resolves API docs for NODE_ENV=%s API_DOCS_ENABLED=%s",
    (NODE_ENV, flag, expected) => {
      const input = { ...base, NODE_ENV, ...(flag ? { API_DOCS_ENABLED: flag } : {}) };
      expect(envSchema.parse(input).API_DOCS_ENABLED).toBe(expected);
    },
  );

  it("rejects ambiguous API_DOCS_ENABLED values", () => {
    for (const API_DOCS_ENABLED of ["1", "yes", "TRUE", ""])
      expect(envSchema.safeParse({ ...base, API_DOCS_ENABLED }).success).toBe(false);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import configPlugin, {
  envSchema,
  durationToMilliseconds,
  readConfig,
} from "../../src/plugins/config";

const valid = {
  DATABASE_URL: "postgresql://synthetic:synthetic@localhost/synthetic",
  JWT_SECRET: "synthetic-secret",
};
afterEach(() => vi.unstubAllEnvs());
describe("API configuration contract", () => {
  it.each(["0s", "-1s", "1.5m", "1w", "", "Infinityd"])(
    "rejects malformed duration %j",
    (value) => {
      expect(Number.isNaN(durationToMilliseconds(value))).toBe(true);
      expect(envSchema.safeParse({ ...valid, RATE_LIMIT_TIMEWINDOW: value }).success).toBe(false);
    },
  );
  it.each([
    ["1s", 1000],
    ["2m", 120000],
    ["3h", 10800000],
    ["1d", 86400000],
  ] as const)("converts duration %s consistently", (value, expected) => {
    expect(durationToMilliseconds(value)).toBe(expected);
  });
  it("does not expose invalid setting values in configuration exceptions", () => {
    expect(() => readConfig({ ...valid, DATABASE_URL: "synthetic-private-invalid-url" })).toThrow(
      /^Invalid environment variables: DATABASE_URL$/,
    );
  });
  it.each([
    { LOG_LEVEL: "verbose" },
    { LOG_LEVEL: "" },
    { RATE_LIMIT_MAX: String(Number.MAX_SAFE_INTEGER + 1) },
    { RATE_LIMIT_TIMEWINDOW: "999999999999999999999d" },
    { JWT_EXPIRES_IN: "999999999999999999999d" },
    { FIREBASE_ADMIN_PROJECT_ID: "synthetic-project" },
    { FIREBASE_ADMIN_CLIENT_EMAIL: "service@example.test" },
    { FIREBASE_ADMIN_PRIVATE_KEY: "synthetic-private-key" },
    { FIREBASE_ADMIN_PROJECT_ID: " " },
    {
      FIREBASE_ADMIN_PROJECT_ID: "project",
      FIREBASE_ADMIN_CLIENT_EMAIL: "invalid",
      FIREBASE_ADMIN_PRIVATE_KEY: "key",
    },
  ])("rejects invalid settings %j", (settings) => {
    expect(envSchema.safeParse({ ...valid, ...settings }).success).toBe(false);
  });
  it.each(["fatal", "error", "warn", "info", "debug", "trace", "silent"])(
    "accepts supported log level %s",
    (LOG_LEVEL) => {
      expect(envSchema.parse({ ...valid, LOG_LEVEL }).LOG_LEVEL).toBe(LOG_LEVEL);
    },
  );
  it("retains defaults and normalizes configured origins, proxies and provider credentials", () => {
    const result = envSchema.parse({
      ...valid,
      FRONTEND_URL: " https://shop.example.test/, https://admin.example.test ",
      TRUST_PROXY: "127.0.0.1, ::1, ,loopback",
      FEDEX_API_KEY: " key ",
      FEDEX_SECRET_KEY: " secret ",
      FEDEX_ACCOUNT_NUMBER: " account ",
      FIREBASE_ADMIN_PROJECT_ID: " project ",
      FIREBASE_ADMIN_CLIENT_EMAIL: " service@example.test ",
      FIREBASE_ADMIN_PRIVATE_KEY: " key ",
    });
    expect(result).toMatchObject({
      PORT: 3001,
      NODE_ENV: "development",
      LOG_LEVEL: "info",
      JWT_EXPIRES_IN: "7d",
      RATE_LIMIT_MAX: 5000,
      RATE_LIMIT_TIMEWINDOW: "1m",
      FRONTEND_URL: "https://shop.example.test,https://admin.example.test",
      TRUST_PROXY: ["127.0.0.1", "::1", "loopback"],
      FIREBASE_ADMIN_PROJECT_ID: "project",
      FIREBASE_ADMIN_CLIENT_EMAIL: "service@example.test",
      FIREBASE_ADMIN_PRIVATE_KEY: "key",
    });
    expect(envSchema.parse(valid).TRUST_PROXY).toEqual([]);
  });
  it("reports invalid configuration paths without their values", async () => {
    vi.stubEnv("DATABASE_URL", "synthetic-private-invalid-url");
    vi.stubEnv("JWT_SECRET", "synthetic-secret");
    const app = Fastify();
    try {
      await expect(app.register(configPlugin)).rejects.toThrow("DATABASE_URL");
      expect(app.hasDecorator("config")).toBe(false);
    } finally {
      await app.close();
    }
  });
});

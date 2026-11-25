import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = vi.hoisted(() => ({
  set: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => jar }));

import { POST as sync } from "../app/api/auth/sync/route";
import { POST as clear } from "../app/api/auth/clear/route";

const origin = "https://shop.example.test";
const request = (
  path: string,
  { headers = {}, body }: { headers?: Record<string, string>; body?: string } = {},
) => new Request(`${origin}${path}`, { method: "POST", headers, body });
const sameOrigin = {
  "content-type": "application/json",
  origin,
  host: "shop.example.test",
  "sec-fetch-site": "same-origin",
};
const tokens = JSON.stringify({ accessToken: "access.jwt.value", refreshToken: "refresh.jwt" });

beforeEach(() => vi.clearAllMocks());

describe("auth cookie sync route", () => {
  it("mirrors only the access token for a same-origin JSON request", async () => {
    const response = await sync(request("/api/auth/sync", { headers: sameOrigin, body: tokens }));
    expect(response.status).toBe(200);
    expect(jar.set).toHaveBeenCalledTimes(1);
    expect(jar.set).toHaveBeenCalledWith(
      "tasheen.access_token",
      "access.jwt.value",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", secure: true, path: "/" }),
    );
  });

  it.each([
    [
      "cross-site form post (text/plain JSON trick)",
      {
        ...sameOrigin,
        "content-type": "text/plain",
        "sec-fetch-site": "cross-site",
        origin: "https://evil.test",
      },
    ],
    [
      "cross-site fetch with JSON",
      { ...sameOrigin, "sec-fetch-site": "cross-site", origin: "https://evil.test" },
    ],
    [
      "same-site sibling origin",
      { ...sameOrigin, "sec-fetch-site": "same-site", origin: "https://blog.example.test" },
    ],
    ["non-JSON body from the same origin", { ...sameOrigin, "content-type": "text/plain" }],
    [
      "no fetch metadata and a foreign Origin",
      {
        "content-type": "application/json",
        origin: "https://evil.test",
        host: "shop.example.test",
      },
    ],
    [
      "no fetch metadata and no Origin",
      { "content-type": "application/json", host: "shop.example.test" },
    ],
  ])("rejects %s without setting cookies", async (_label, headers) => {
    const response = await sync(request("/api/auth/sync", { headers, body: tokens }));
    expect(response.status).toBe(403);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("accepts legacy browsers without fetch metadata when Origin matches the forwarded host", async () => {
    const response = await sync(
      request("/api/auth/sync", {
        headers: {
          "content-type": "application/json; charset=utf-8",
          origin,
          host: "internal:3000",
          "x-forwarded-host": "shop.example.test",
        },
        body: tokens,
      }),
    );
    expect(response.status).toBe(200);
  });

  it.each([
    ["missing token", JSON.stringify({})],
    ["non-string token", JSON.stringify({ accessToken: 42 })],
    ["malformed JSON", "{"],
    ["oversized token", JSON.stringify({ accessToken: "a".repeat(4097) })],
  ])("rejects %s", async (_label, body) => {
    const response = await sync(request("/api/auth/sync", { headers: sameOrigin, body }));
    expect(response.status).toBe(400);
    expect(jar.set).not.toHaveBeenCalled();
  });
});

describe("auth cookie clear route", () => {
  it("clears both current and legacy auth cookies for a same-origin request", async () => {
    const response = await clear(request("/api/auth/clear", { headers: sameOrigin }));
    expect(response.status).toBe(200);
    expect(jar.delete).toHaveBeenCalledWith("tasheen.access_token");
    expect(jar.delete).toHaveBeenCalledWith("tasheen.refresh_token");
  });

  it("rejects cross-site logout requests", async () => {
    const response = await clear(
      request("/api/auth/clear", {
        headers: { "sec-fetch-site": "cross-site", origin: "https://evil.test" },
      }),
    );
    expect(response.status).toBe(403);
    expect(jar.delete).not.toHaveBeenCalled();
  });
});

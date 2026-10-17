import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../src/index";

afterEach(() => vi.unstubAllGlobals());

const ok = () =>
  new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });

describe("authenticated API client retries", () => {
  it("shares a refresh operation and retries each concurrent request once", async () => {
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "rotated";
    });
    const fetchMock = vi.fn(async (request: Request) =>
      request.headers.get("Authorization") === "Bearer rotated"
        ? ok()
        : new Response(null, { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = createApiClient({
      baseUrl: "https://api.example.com",
      getToken: () => "old",
      refreshToken: refresh,
    });
    await Promise.all([client.GET("/api/v1/auth/me"), client.GET("/api/v1/auth/me")]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("keeps network failures visible and permits subsequent requests", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementation(async () => ok());
    vi.stubGlobal("fetch", fetchMock);
    const refresh = vi.fn(async () => "rotated");
    const client = createApiClient({ baseUrl: "https://api.example.com", refreshToken: refresh });
    await expect(client.GET("/api/v1/auth/me")).rejects.toThrow("offline");
    await expect(client.GET("/api/v1/auth/me")).resolves.toBeDefined();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("returns an unauthorized response when refresh fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      baseUrl: "https://api.example.com",
      refreshToken: async () => {
        throw new Error("expired");
      },
      onUnauthorized,
    });
    const result = await client.GET("/api/v1/auth/me");
    expect(result.response.status).toBe(401);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});

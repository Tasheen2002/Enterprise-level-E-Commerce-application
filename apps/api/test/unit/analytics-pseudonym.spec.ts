import { afterEach, describe, expect, it, vi } from "vitest";
import { pseudonymizeGuestToken } from "@/api/src/shared/utils/analytics-pseudonym";

describe("pseudonymizeGuestToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a stable keyed hash that does not contain the token", () => {
    vi.stubEnv("ANALYTICS_PSEUDONYM_SECRET", "test-secret");
    const first = pseudonymizeGuestToken("guest_abc");
    expect(first).toMatch(/^gt_[A-Za-z0-9_-]+$/);
    expect(first).not.toContain("guest_abc");
    expect(pseudonymizeGuestToken("guest_abc")).toBe(first);
    expect(pseudonymizeGuestToken("guest_other")).not.toBe(first);
  });

  it("depends on the secret", () => {
    vi.stubEnv("ANALYTICS_PSEUDONYM_SECRET", "secret-a");
    const a = pseudonymizeGuestToken("guest_abc");
    vi.stubEnv("ANALYTICS_PSEUDONYM_SECRET", "secret-b");
    expect(pseudonymizeGuestToken("guest_abc")).not.toBe(a);
  });

  it("drops the token rather than storing it when no secret is configured", () => {
    vi.stubEnv("ANALYTICS_PSEUDONYM_SECRET", "");
    vi.stubEnv("JWT_SECRET", "");
    expect(pseudonymizeGuestToken("guest_abc")).toBeUndefined();
    expect(pseudonymizeGuestToken(undefined)).toBeUndefined();
  });
});

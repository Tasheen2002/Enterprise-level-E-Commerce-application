import { describe, expect, it } from "vitest";
import { isEditorialLookLive, isProductLive } from "../../../domain/policies/storefront-visibility";
import { queryBoolean } from "@/api/src/shared/http/validation";

const now = new Date("2026-06-01T12:00:00Z");
const past = "2026-05-01T00:00:00Z";
const future = "2026-07-01T00:00:00Z";

describe("storefront visibility", () => {
  it.each([
    ["published", null, true],
    ["scheduled", past, true],
    ["scheduled", future, false],
    ["scheduled", null, false],
    ["draft", past, false],
    ["archived", past, false],
  ] as const)("product %s (publishAt %s) live=%s", (status, publishAt, live) => {
    expect(isProductLive(status, publishAt, now)).toBe(live);
  });

  it("treats editorial looks as live only once their publication time has passed", () => {
    expect(isEditorialLookLive(past, now)).toBe(true);
    expect(isEditorialLookLive(future, now)).toBe(false);
    expect(isEditorialLookLive(null, now)).toBe(false);
  });
});

describe("query-string booleans", () => {
  it.each([
    ["true", true],
    ["false", false],
    [true, true],
    [false, false],
  ] as const)("%s parses to %s", (input, expected) => {
    expect(queryBoolean().parse(input)).toBe(expected);
  });

  it.each(["yes", "0", "", "FALSE"])("rejects %j", (input) => {
    expect(queryBoolean().safeParse(input).success).toBe(false);
  });
});

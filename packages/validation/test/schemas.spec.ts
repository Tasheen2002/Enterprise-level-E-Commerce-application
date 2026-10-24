import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as root from "../src";
import * as common from "../src/common";
import * as auth from "../src/auth";
import * as user from "../src/user";
import { schemaCases } from "./schema-cases";
import { paginationQuerySchema as backendPagination } from "../../../apps/api/src/shared/http/validation";

describe("shared/backend wire schema contracts", () => {
  it.each(schemaCases)("matches $name JSON constraints", ({ shared, backend }) => {
    expect(z.toJSONSchema(shared)).toEqual(z.toJSONSchema(backend));
  });
  it.each(schemaCases)(
    "accepts valid $name input and strips extra top-level fields",
    ({ shared, backend, valid }) => {
      const input = { ...valid, role: "ADMIN", injected: true };
      expect(shared.parse(input)).toEqual(valid);
      expect(shared.parse(input)).toEqual(backend.parse(input));
    },
  );
  it.each(schemaCases)(
    "rejects invalid $name input with matching paths/codes",
    ({ shared, backend, invalid }) => {
      const left = shared.safeParse(invalid);
      const right = backend.safeParse(invalid);
      expect(left.success).toBe(false);
      expect(right.success).toBe(false);
      if (left.success || right.success) throw new Error("Invalid input accepted");
      expect(left.error.issues.map(({ path, code }) => ({ path, code }))).toEqual(
        right.error.issues.map(({ path, code }) => ({ path, code })),
      );
    },
  );
  it("keeps root/subpath exports and the shared profile facade compatible", () => {
    expect(root.paginationQuerySchema).toBe(common.paginationQuerySchema);
    expect(root.paginatedResponseShape).toBe(common.paginatedResponseShape);
    expect(backendPagination).toBe(common.paginationQuerySchema);
    expect(auth.updateProfileRequestSchema).toBe(user.updateProfileRequestSchema);
    expect(auth.signInFormSchema).toBe(auth.loginRequestSchema);
    expect(root).not.toHaveProperty("registerRequestSchema");
  });
});

describe("authentication bounds and UI-only refinements", () => {
  const passwordFields = schemaCases
    .filter((c) => c.name !== "profile")
    .flatMap((c) =>
      Object.keys(c.valid)
        .filter((field) => /password/i.test(field))
        .map((field) => ({ ...c, field })),
    );
  it.each(passwordFields)(
    "bounds $name password field $field at 128 characters",
    ({ shared, backend, valid, field }) => {
      const atLimit = { ...valid, [field]: "x".repeat(128) };
      const overLimit = { ...valid, [field]: "x".repeat(129) };
      expect(shared.safeParse(atLimit).success).toBe(true);
      expect(backend.safeParse(atLimit).success).toBe(true);
      expect(shared.safeParse(overLimit).success).toBe(false);
      expect(backend.safeParse(overLimit).success).toBe(false);
    },
  );
  const signUp = {
    email: "test@example.com",
    password: "password",
    confirmPassword: "password",
    firstName: "A",
    lastName: "B",
    agreeToTerms: true,
  };
  it("retains valid sign-up and removes form-only fields from a wire parse", () => {
    const parsed = auth.signUpFormSchema.parse(signUp);
    expect(auth.registerRequestSchema.parse(parsed)).toEqual({
      email: signUp.email,
      password: signUp.password,
      firstName: "A",
      lastName: "B",
    });
  });
  it.each([
    { label: "terms", value: { agreeToTerms: false }, path: "agreeToTerms" },
    {
      label: "password mismatch",
      value: { confirmPassword: "different" },
      path: "confirmPassword",
    },
    { label: "empty first name", value: { firstName: "" }, path: "firstName" },
    { label: "empty surname", value: { lastName: "" }, path: "lastName" },
  ])("rejects sign-up $label at the correct field", ({ value, path }) => {
    const result = auth.signUpFormSchema.safeParse({ ...signUp, ...value });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.some((issue) => issue.path[0] === path)).toBe(true);
  });
  it.each(["firstName", "lastName"])("enforces the register %s boundary", (field) => {
    const input = { email: "test@example.com", password: "password" };
    expect(
      auth.registerRequestSchema.safeParse({ ...input, [field]: "x".repeat(50) }).success,
    ).toBe(true);
    expect(
      auth.registerRequestSchema.safeParse({ ...input, [field]: "x".repeat(51) }).success,
    ).toBe(false);
  });
  it.each(["idToken", "pendingToken"])("bounds %s and retains token contents", (field) => {
    const schema =
      field === "idToken" ? auth.verifyPhoneRequestSchema : auth.verify2FALoginRequestSchema;
    expect(schema.parse({ [field]: "x".repeat(4096), code: "123456" })).toMatchObject({
      [field]: "x".repeat(4096),
    });
    expect(schema.safeParse({ [field]: "x".repeat(4097), code: "123456" }).success).toBe(false);
  });
});

describe("pagination transport boundaries", () => {
  it("coerces query strings without adding defaults and strips unknown fields", () => {
    expect(common.paginationQuerySchema.parse({})).toEqual({});
    expect(common.paginationQuerySchema.parse({ limit: "100", offset: "0", ignored: 1 })).toEqual({
      limit: 100,
      offset: 0,
    });
  });
  it.each([
    { limit: "0" },
    { limit: "101" },
    { limit: "1.5" },
    { limit: "bad" },
    { offset: "-1" },
    { offset: "1.5" },
    { offset: Infinity },
    { offset: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects malformed/out-of-range query %j", (input) => {
    expect(common.paginationQuerySchema.safeParse(input).success).toBe(false);
  });
  it("accepts the zero-limit metadata emitted for an empty unbounded repository page", () => {
    expect(
      common
        .paginatedResponseShape(z.string())
        .parse({ items: [], total: 0, limit: 0, offset: 0, hasMore: false }),
    ).toEqual({ items: [], total: 0, limit: 0, offset: 0, hasMore: false });
  });
  it("checks item schemas and integer/nonnegative response metadata", () => {
    const schema = common.paginatedResponseShape(z.object({ id: z.string() }));
    const page = { items: [{ id: "item" }], total: 2, limit: 1, offset: 0, hasMore: true };
    expect(schema.parse(page)).toEqual(page);
    for (const invalid of [
      { items: [{ id: 1 }] },
      { total: -1 },
      { limit: -1 },
      { limit: 1.5 },
      { offset: -1 },
      { hasMore: "true" },
    ])
      expect(schema.safeParse({ ...page, ...invalid }).success).toBe(false);
  });
});

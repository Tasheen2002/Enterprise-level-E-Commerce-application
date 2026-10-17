import { describe, expect, it } from "vitest";
import {
  isDatabaseTestPath,
  requireTestDatabase,
} from "../../../../scripts/testing/database-safety";

describe("database test classification before client imports", () => {
  it.each([
    "modules/cart/test/integration/repository.spec.ts",
    "modules/cart/test/e2e/checkout.spec.ts",
    "C:\\project\\modules\\cart\\test\\integration\\repository.spec.ts",
    "C:\\project\\modules\\cart\\test\\E2E\\checkout.spec.ts",
    "modules/cart/test/repository.integration.spec.ts",
    "modules/cart/test/checkout.e2e.test.ts",
  ])("guards database suite %s", (testPath) => {
    expect(isDatabaseTestPath(testPath)).toBe(true);
    expect(() => requireTestDatabase({})).toThrow("Database tests require");
  });

  it.each([
    undefined,
    "",
    "modules/cart/test/unit/repository.spec.ts",
    "modules/cart/test/integration-helper.spec.ts",
    "modules/cart/test/unit/e2e-helper.spec.ts",
  ])("does not treat a unit helper path as a database suite: %s", (testPath) => {
    expect(isDatabaseTestPath(testPath)).toBe(false);
  });
});

describe("isolated database destination policy", () => {
  it.each([
    "postgres://test:test@127.0.0.1/example_test",
    "postgresql://test:test@[::1]/example_test",
    "postgresql://test:test@localhost/example_test_worker1",
  ])("accepts an explicitly enabled local test destination: %s", (url) => {
    expect(requireTestDatabase({ TEST_DATABASE_URL: url, ALLOW_DATABASE_TEST_CLEANUP: "1" })).toBe(
      new URL(url).toString(),
    );
  });

  it("requires an exact explicit host match for a nonlocal test database", () => {
    const url = "postgresql://test:test@audit-db.internal/example_test";
    expect(
      requireTestDatabase({
        TEST_DATABASE_URL: url,
        ALLOW_DATABASE_TEST_CLEANUP: "1",
        TEST_DATABASE_HOST: "audit-db.internal",
      }),
    ).toBe(url);
    expect(() =>
      requireTestDatabase({
        TEST_DATABASE_URL: url,
        ALLOW_DATABASE_TEST_CLEANUP: "1",
        TEST_DATABASE_HOST: "*.internal",
      }),
    ).toThrow("Refusing database cleanup");
  });

  it.each([
    { ALLOW_DATABASE_TEST_CLEANUP: "1" },
    {
      ALLOW_DATABASE_TEST_CLEANUP: "1",
      TEST_DATABASE_URL: "mysql://test:test@localhost/example_test",
    },
    {
      ALLOW_DATABASE_TEST_CLEANUP: "1",
      TEST_DATABASE_URL: "postgresql://test:test@localhost/example_dev",
    },
    {
      ALLOW_DATABASE_TEST_CLEANUP: "1",
      TEST_DATABASE_URL: "postgresql://test:test@localhost.invalid/example_test",
    },
    { ALLOW_DATABASE_TEST_CLEANUP: "1", TEST_DATABASE_URL: "not-a-url" },
  ])("rejects an unsafe or unusable destination", (env) => {
    expect(() => requireTestDatabase(env)).toThrow();
  });
});

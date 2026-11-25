import { describe, expect, it } from "vitest";
import {
  requireOperationalTestDatabase,
  requireTestDatabaseAdmin,
} from "../../../../scripts/testing/operational-database";

const enabled = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://fixture:fixture@localhost:5432/shop_test",
};

describe("legacy operational database boundaries", () => {
  it("accepts only the explicitly selected disposable test destination", () => {
    expect(
      requireOperationalTestDatabase({
        ...enabled,
        DATABASE_URL: "postgresql://ignored/production",
      }),
    ).toBe(enabled.TEST_DATABASE_URL);
  });

  it.each([
    {},
    { ...enabled, NODE_ENV: "production" },
    { ...enabled, ALLOW_OPERATIONAL_DATABASE_WRITES: undefined },
    { ...enabled, ALLOW_DATABASE_TEST_CLEANUP: undefined },
    { ...enabled, TEST_DATABASE_URL: "postgresql://fixture:fixture@localhost/shop_dev" },
    { ...enabled, TEST_DATABASE_URL: "postgresql://fixture:fixture@unapproved.example/shop_test" },
  ])("rejects absent opt-in, production and unsafe destinations before construction", (env) => {
    expect(() => requireOperationalTestDatabase(env)).toThrow();
  });

  it("requires separate maintenance credentials on exactly the same server", () => {
    expect(
      requireTestDatabaseAdmin({
        ...enabled,
        TEST_DATABASE_ADMIN_URL: "postgresql://admin:fixture@localhost:5432/postgres",
      }),
    ).toEqual({
      url: "postgresql://admin:fixture@localhost:5432/postgres",
      database: "shop_test",
    });
  });

  it.each([
    undefined,
    "postgresql://admin:fixture@elsewhere:5432/postgres",
    "postgresql://admin:fixture@localhost:9999/postgres",
    "postgresql://admin:fixture@localhost:5432/shop_dev",
    "postgresql://admin:fixture@localhost:5432/postgres?host=elsewhere",
    "mysql://admin:fixture@localhost:5432/postgres",
    "not-a-url",
  ])("rejects ambiguous or mismatched maintenance destinations", (url) => {
    expect(() => requireTestDatabaseAdmin({ ...enabled, TEST_DATABASE_ADMIN_URL: url })).toThrow();
  });

  it("treats omitted and explicit default PostgreSQL ports alike", () => {
    expect(
      requireTestDatabaseAdmin({
        ...enabled,
        TEST_DATABASE_ADMIN_URL: "postgres://admin:fixture@localhost/postgres",
      }).database,
    ).toBe("shop_test");
  });

  it.each(["a_test;DROP DATABASE other", "a_test_" + "x".repeat(64)])(
    "rejects names unsuitable for a PostgreSQL identifier",
    (database) => {
      expect(() =>
        requireTestDatabaseAdmin({
          ...enabled,
          TEST_DATABASE_URL: `postgresql://fixture:fixture@localhost/${encodeURIComponent(database)}`,
          TEST_DATABASE_ADMIN_URL: "postgresql://admin:fixture@localhost/postgres",
        }),
      ).toThrow();
    },
  );
});

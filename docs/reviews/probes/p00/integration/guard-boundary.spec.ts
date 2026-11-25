import { expect, it } from "vitest";

// Passing this diagnostic reproduces a defect: the real setup allowed a file
// under integration/ to execute without the required isolated-test settings.
// No Prisma client is instantiated by this fixture and no database is queried.
it("records that an integration-directory fixture reached its body without cleanup opt-in", () => {
  expect(process.env.ALLOW_DATABASE_TEST_CLEANUP).toBeUndefined();
  expect(process.env.TEST_DATABASE_URL).toBeUndefined();
  expect(process.env.DATABASE_URL).toBe(
    "postgresql://synthetic:synthetic@127.0.0.1:1/never_connect",
  );
});

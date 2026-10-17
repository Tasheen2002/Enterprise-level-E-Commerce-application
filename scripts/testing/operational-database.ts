import { requireTestDatabase } from "./database-safety";

/** Legacy write tools only operate on explicitly selected disposable test databases. */
export function requireOperationalTestDatabase(env: NodeJS.ProcessEnv): string {
  if (env.NODE_ENV !== "test" || env.ALLOW_OPERATIONAL_DATABASE_WRITES !== "1") {
    throw new Error(
      "Operational writes require NODE_ENV=test and ALLOW_OPERATIONAL_DATABASE_WRITES=1",
    );
  }
  return requireTestDatabase(env);
}

export function requireTestDatabaseAdmin(env: NodeJS.ProcessEnv): {
  url: string;
  database: string;
} {
  const target = new URL(requireOperationalTestDatabase(env));
  if (!env.TEST_DATABASE_ADMIN_URL) throw new Error("TEST_DATABASE_ADMIN_URL is required");
  const admin = new URL(env.TEST_DATABASE_ADMIN_URL);
  const database = decodeURIComponent(target.pathname.slice(1));
  if (
    !["postgres:", "postgresql:"].includes(admin.protocol) ||
    admin.hostname !== target.hostname ||
    (admin.port || "5432") !== (target.port || "5432") ||
    admin.pathname !== "/postgres" ||
    admin.search !== "" ||
    target.search !== "" ||
    !/^[a-zA-Z0-9_]+$/.test(database) ||
    Buffer.byteLength(database, "utf8") > 63
  ) {
    throw new Error(
      "Refusing database administration: use the same server, postgres maintenance database and a safe test name",
    );
  }
  return { url: admin.toString(), database };
}

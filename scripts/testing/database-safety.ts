/** Validate before importing/constructing any database test clients. */
export function requireTestDatabase(env: NodeJS.ProcessEnv): string {
  if (env.ALLOW_DATABASE_TEST_CLEANUP !== "1" || !env.TEST_DATABASE_URL) {
    throw new Error("Database tests require TEST_DATABASE_URL and ALLOW_DATABASE_TEST_CLEANUP=1");
  }
  const url = new URL(env.TEST_DATABASE_URL);
  const database = decodeURIComponent(url.pathname.slice(1));
  const allowedHost = env.TEST_DATABASE_HOST ?? "localhost";
  const localHosts = ["localhost", "127.0.0.1", "[::1]"];
  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !/^\w+_test(?:_[a-zA-Z0-9]+)?$/.test(database) ||
    !(localHosts.includes(url.hostname) || url.hostname === allowedHost)
  ) {
    throw new Error(
      "Refusing database cleanup: expected an allowlisted host and a dedicated *_test database",
    );
  }
  return url.toString();
}

/** One configured identity policy for disposable admin seeding and inspection. */
export function requireTestAdminEmail(env: NodeJS.ProcessEnv): string {
  const email = env.TEST_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Provide a valid TEST_ADMIN_EMAIL");
  }
  return email;
}

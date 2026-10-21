import { UserRole, UserStatus, type PrismaClient } from "@prisma/client";
import { runDatabaseInspection } from "./database-inspection";

export interface TestAdminSummary {
  verified: true;
  role: "ADMIN";
  status: "active";
}

/** Verify only the configured test account's role/status; no authentication or secret checks. */
export async function verifyTestAdmin(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: TestAdminSummary) => void,
): Promise<void> {
  // Match seed-admin's configured identity normalization.
  const email = env.TEST_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Provide a valid TEST_ADMIN_EMAIL");
  }
  await runDatabaseInspection<TestAdminSummary>(
    env,
    createClient,
    async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { role: true, status: true },
      });
      if (!user || user.role !== UserRole.ADMIN || user.status !== UserStatus.active) {
        throw new Error("Expected an active test administrator");
      }
      return { verified: true, role: "ADMIN", status: "active" };
    },
    report,
  );
}

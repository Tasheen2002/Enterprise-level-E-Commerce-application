import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";
import { withOperationalTestDatabase } from "../scripts/testing/database-inspection";
import { requireTestAdminEmail } from "../scripts/testing/test-admin-settings";

async function main() {
  // Refuse before hashing; the shared client lifecycle revalidates after the async hash.
  requireOperationalTestDatabase(process.env);
  const email = requireTestAdminEmail(process.env);
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!password || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error(
      "Provide TEST_ADMIN_PASSWORD (at least 12 characters and at most 72 UTF-8 bytes)",
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await withOperationalTestDatabase(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    async (prisma) => {
      // A conflict fails without deleting or modifying an existing account.
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.active,
          emailVerified: true,
          isGuest: false,
        },
      });
    },
  );
  console.log("Test administrator created.");
}
main().catch(() => {
  console.error(
    "Test administrator creation refused or failed; check settings and whether the account exists.",
  );
  process.exitCode = 1;
});

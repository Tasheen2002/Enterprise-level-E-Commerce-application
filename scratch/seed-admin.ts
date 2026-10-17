import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";

async function main() {
  const url = requireOperationalTestDatabase(process.env);
  const email = process.env.TEST_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
    throw new Error("Provide TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD (at least 12 characters)");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
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
    console.log("Test administrator created.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Test administrator creation refused or failed; check settings and whether the account exists.",
  );
  process.exitCode = 1;
});

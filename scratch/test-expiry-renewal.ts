import { PrismaClient } from "@prisma/client";
import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";
import { runCartExpiryProbe } from "../scripts/testing/cart-expiry-probe";
import type { CartManagementService } from "../modules/cart/application/services/cart-management.service";

async function main() {
  const url = requireOperationalTestDatabase(process.env);
  delete process.env.STRIPE_SECRET_KEY;
  const { container } = await import("../apps/api/src/container");
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    container.register(prisma, { jwtSecret: "isolated-expiry-probe-secret", jwtExpiresIn: "1h" });
    await runCartExpiryProbe(prisma, container.get<CartManagementService>("cartManagementService"));
    console.log(
      "Cart and reservation renewal verified; isolated fixtures removed. No HTTP server started.",
    );
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  const candidate = error && typeof error === "object" && "code" in error ? error.code : undefined;
  const code =
    typeof candidate === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(candidate)
      ? candidate
      : "UNCLASSIFIED";
  const kind =
    error instanceof Error && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(error.name)
      ? error.name
      : "UnknownError";
  const probeAssertion =
    error instanceof Error &&
    [
      "Expiry probe must start with its own expired cart",
      "Cart expiry, reservation expiry or quantity was not renewed consistently",
    ].includes(error.message)
      ? "ASSERTION"
      : "OPERATION";
  console.error(`Cart expiry probe refused or failed. [${kind}:${code}:${probeAssertion}]`);
  process.exitCode = 1;
});

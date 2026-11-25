import { PrismaClient } from "@prisma/client";
import { withOperationalTestDatabase } from "../scripts/testing/database-inspection";
import { runCartExpiryProbe } from "../scripts/testing/cart-expiry-probe";
import type { CartManagementService } from "../modules/cart/application/services/cart-management.service";

async function main() {
  await withOperationalTestDatabase(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    async (prisma) => {
      delete process.env.STRIPE_SECRET_KEY;
      const { container } = await import("../apps/api/src/container");
      container.register(prisma, { jwtSecret: "isolated-expiry-probe-secret", jwtExpiresIn: "1h" });
      await runCartExpiryProbe(
        prisma,
        container.get<CartManagementService>("cartManagementService"),
      );
    },
  );
  console.log(
    "Cart and reservation renewal verified; isolated fixtures removed. No HTTP server started.",
  );
}
main().catch(() => {
  console.error("Cart expiry probe refused or failed.");
  process.exitCode = 1;
});

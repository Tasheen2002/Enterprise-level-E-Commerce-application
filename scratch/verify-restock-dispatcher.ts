import { PrismaClient } from "@prisma/client";
import { withOperationalTestDatabase } from "../scripts/testing/database-inspection";
import { runRestockDispatcherProbe } from "../scripts/testing/restock-probes";
import type { IEventBus } from "../packages/core/src/domain/events/domain-event";

async function main() {
  await withOperationalTestDatabase(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    async (prisma) => {
      // Prevent optional provider wiring in this standalone test process.
      delete process.env.STRIPE_SECRET_KEY;
      const { container } = await import("../apps/api/src/container");
      const { NodemailerEmailService } = await import(
        "../modules/user-management/infra/security/nodemailer-email.adapter"
      );
      const original = NodemailerEmailService.prototype.sendEmail;
      let deliveryAttempts = 0;
      try {
        NodemailerEmailService.prototype.sendEmail = async () => {
          deliveryAttempts++;
          throw new Error("Outbound email forbidden in the operational probe");
        };
        container.register(prisma, {
          jwtSecret: "isolated-restock-probe-secret",
          jwtExpiresIn: "1h",
        });
        const bus = container.get<IEventBus>("eventBus");
        await runRestockDispatcherProbe(prisma, (event) => bus.publish(event));
        if (deliveryAttempts) throw new Error("Unexpected outbound email attempt");
      } finally {
        NodemailerEmailService.prototype.sendEmail = original;
      }
    },
  );
  console.log(
    "Simulated restock subscriber state verified; fixtures removed. Actual email/SMS delivery remains unverified.",
  );
}
main().catch(() => {
  console.error("Restock dispatcher probe refused or failed.");
  process.exitCode = 1;
});

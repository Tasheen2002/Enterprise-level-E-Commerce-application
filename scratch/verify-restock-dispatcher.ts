import { PrismaClient } from "@prisma/client";
import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";
import { runRestockDispatcherProbe } from "../scripts/testing/restock-probes";
import type { IEventBus } from "../packages/core/src/domain/events/domain-event";

async function main() {
  const url = requireOperationalTestDatabase(process.env);
  // Prevent optional provider wiring. This standalone test process uses no provider credentials.
  delete process.env.STRIPE_SECRET_KEY;
  const { container } = await import("../apps/api/src/container");
  const { NodemailerEmailService } = await import(
    "../modules/user-management/infra/security/nodemailer-email.adapter"
  );
  const original = NodemailerEmailService.prototype.sendEmail;
  let deliveryAttempts = 0;
  NodemailerEmailService.prototype.sendEmail = async () => {
    deliveryAttempts++;
    throw new Error("Outbound email forbidden in the operational probe");
  };
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    container.register(prisma, { jwtSecret: "isolated-restock-probe-secret", jwtExpiresIn: "1h" });
    const bus = container.get<IEventBus>("eventBus");
    await runRestockDispatcherProbe(prisma, (event) => bus.publish(event));
    if (deliveryAttempts) throw new Error("Unexpected outbound email attempt");
    console.log(
      "Simulated restock subscriber state verified; fixtures removed. Actual email/SMS delivery remains unverified.",
    );
  } finally {
    NodemailerEmailService.prototype.sendEmail = original;
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error("Restock dispatcher probe refused or failed.");
  process.exitCode = 1;
});

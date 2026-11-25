import { Prisma, type PrismaClient } from "@prisma/client";
import { runDatabaseInspection } from "./database-inspection";

export interface CartExpirySummary {
  asOf: string;
  carts: { expired: number; active: number; withoutExpiry: number };
  reservations: { expired: number; active: number };
  cartItems: number;
}

/** Read counts only, with one cutoff and one consistent snapshot; never select identities/tokens. */
export async function inspectCartExpiry(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: CartExpirySummary) => void,
  asOf = new Date(),
): Promise<void> {
  if (!Number.isFinite(asOf.getTime())) throw new Error("Invalid inspection cutoff");
  await runDatabaseInspection(
    env,
    createClient,
    (prisma) =>
      prisma.$transaction(
        async (tx) => {
          const [expired, active, withoutExpiry, expiredHolds, activeHolds, cartItems] =
            await Promise.all([
              tx.shoppingCart.count({ where: { reservationExpiresAt: { lte: asOf } } }),
              tx.shoppingCart.count({ where: { reservationExpiresAt: { gt: asOf } } }),
              tx.shoppingCart.count({ where: { reservationExpiresAt: null } }),
              tx.reservation.count({ where: { expiresAt: { lte: asOf } } }),
              tx.reservation.count({ where: { expiresAt: { gt: asOf } } }),
              tx.cartItem.count(),
            ]);
          return {
            asOf: asOf.toISOString(),
            carts: { expired, active, withoutExpiry },
            reservations: { expired: expiredHolds, active: activeHolds },
            cartItems,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 10_000 },
      ),
    report,
  );
}

import { Prisma, type PrismaClient } from "@prisma/client";
import { runDatabaseInspection } from "./database-inspection";

export interface LoyaltyInspectionSummary {
  scope: "all-loyalty-rows";
  accounts: {
    rows: number;
    currentBalance: string;
    lifetimePoints: string;
    totalPointsEarned: string;
    totalPointsRedeemed: string;
  };
  transactions: { rows: number; storedPointsTotal: string };
}

/** Raw database totals only; no identities, ledger reconciliation or filesystem export. */
export async function inspectLoyaltyData(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: LoyaltyInspectionSummary) => void,
): Promise<void> {
  await runDatabaseInspection<LoyaltyInspectionSummary>(
    env,
    createClient,
    (prisma) =>
      prisma.$transaction(
        async (tx) => {
          const accounts = await tx.loyaltyAccount.aggregate({
            _count: { _all: true },
            _sum: {
              currentBalance: true,
              lifetimePoints: true,
              totalPointsEarned: true,
              totalPointsRedeemed: true,
            },
          });
          const transactions = await tx.loyaltyTransaction.aggregate({
            _count: { _all: true },
            _sum: { points: true },
          });
          return {
            scope: "all-loyalty-rows",
            accounts: {
              rows: accounts._count._all,
              currentBalance: (accounts._sum.currentBalance ?? 0n).toString(),
              lifetimePoints: (accounts._sum.lifetimePoints ?? 0n).toString(),
              totalPointsEarned: (accounts._sum.totalPointsEarned ?? 0n).toString(),
              totalPointsRedeemed: (accounts._sum.totalPointsRedeemed ?? 0n).toString(),
            },
            transactions: {
              rows: transactions._count._all,
              storedPointsTotal: (transactions._sum.points ?? 0n).toString(),
            },
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 10_000 },
      ),
    report,
  );
}

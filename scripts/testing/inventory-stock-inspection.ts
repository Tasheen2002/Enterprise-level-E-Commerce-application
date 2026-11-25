import type { PrismaClient } from "@prisma/client";
import { runDatabaseInspection } from "./database-inspection";

export interface InventoryStockSummary {
  scope: "all-inventory-stock-rows";
  rows: number;
  totalOnHand: number;
  totalReserved: number;
  netOnHandMinusReserved: number;
}

/** One aggregate snapshot; raw totals across all variants/locations, not a stock-validity check. */
export async function inspectInventoryStock(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: InventoryStockSummary) => void,
): Promise<void> {
  await runDatabaseInspection<InventoryStockSummary>(
    env,
    createClient,
    async (prisma) => {
      const totals = await prisma.inventoryStock.aggregate({
        _count: { _all: true },
        _sum: { onHand: true, reserved: true },
      });
      const totalOnHand = totals._sum.onHand ?? 0;
      const totalReserved = totals._sum.reserved ?? 0;
      return {
        scope: "all-inventory-stock-rows",
        rows: totals._count._all,
        totalOnHand,
        totalReserved,
        netOnHandMinusReserved: totalOnHand - totalReserved,
      };
    },
    report,
  );
}

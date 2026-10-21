import { PrismaClient } from "@prisma/client";
import { inspectWalletProducts } from "../scripts/testing/wallet-inspection";

inspectWalletProducts(
  process.env,
  (url) => new PrismaClient({ datasources: { db: { url } } }),
  (summary) => console.log(JSON.stringify(summary)),
).catch(() => {
  console.error("Wallet inspection refused or failed.");
  process.exitCode = 1;
});

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  let output = "";
  const log = (msg: string) => {
    output += msg + "\n";
  };

  log("=== Querying Loyalty Accounts ===");
  const accounts = await prisma.loyaltyAccount.findMany({
    include: {
      users: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (accounts.length === 0) {
    log("No loyalty accounts found in database.");
  } else {
    for (const acc of accounts) {
      log(`Account ID: ${acc.accountId}`);
      log(`User: ${acc.users?.firstName} ${acc.users?.lastName} (${acc.users?.email})`);
      log(`Tier: ${acc.tier}`);
      log(`Current Balance: ${acc.currentBalance.toString()} LP`);
      log(`Lifetime Points: ${acc.lifetimePoints.toString()} LP`);
      log(`Total Earned: ${acc.totalPointsEarned.toString()} LP`);
      log(`Total Redeemed: ${acc.totalPointsRedeemed.toString()} LP`);
      log("---------------------------------------");
    }
  }

  log("\n=== Querying Loyalty Transactions ===");
  const transactions = await prisma.loyaltyTransaction.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (transactions.length === 0) {
    log("No loyalty transactions found in database.");
  } else {
    for (const tx of transactions) {
      log(`Tx ID: ${tx.transactionId}`);
      log(`Account ID: ${tx.accountId}`);
      log(`Type: ${tx.type}`);
      log(`Points: ${tx.points.toString()} LP`);
      log(`Balance After: ${tx.balanceAfter.toString()} LP`);
      log(`Reason: ${tx.reason}`);
      log(`Description: ${tx.description}`);
      log(`Created At: ${tx.createdAt}`);
      log("---------------------------------------");
    }
  }

  const filePath = path.join(__dirname, "loyalty-data.txt");
  fs.writeFileSync(filePath, output, "utf-8");
  console.log(`Successfully wrote loyalty data to ${filePath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

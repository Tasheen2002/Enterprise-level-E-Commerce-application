import type { PrismaClient } from "@prisma/client";
import { requireOperationalTestDatabase } from "./operational-database";

/** Shared lifecycle for reviewed, read-only diagnostics on explicitly selected test databases. */
export async function runDatabaseInspection<T>(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  read: (client: PrismaClient) => Promise<T>,
  report: (summary: T) => void,
): Promise<void> {
  const url = requireOperationalTestDatabase(env);
  const prisma = createClient(url);
  const failures: unknown[] = [];
  try {
    report(await read(prisma));
  } catch (error) {
    failures.push(error);
  }
  try {
    await prisma.$disconnect();
  } catch (error) {
    failures.push(error);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "Database inspection and disconnect failed");
}

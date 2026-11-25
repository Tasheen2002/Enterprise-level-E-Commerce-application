import { Prisma, type PrismaClient } from "@prisma/client";
import { TEST_APPLICATION_SCHEMAS } from "./database-safety";
import { runDatabaseInspection } from "./database-inspection";
import { requireTestDatabaseAdmin } from "./operational-database";

interface CatalogTable {
  schemaname: string;
  tablename: string;
}
export interface TestTableSummary {
  scope: "selected-test-database-application-tables";
  tablesTruncated: boolean;
  tables: Array<{ schema: string; table: string; rows: string }>;
}

/** Quote catalog-derived identifiers; SQL parameters cannot represent schema/table identifiers. */
function identifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export async function inspectTestDatabaseTables(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: TestTableSummary) => void,
): Promise<void> {
  await runDatabaseInspection<TestTableSummary>(
    env,
    createClient,
    (prisma) =>
      prisma.$transaction(
        async (tx) => {
          const tables = await tx.$queryRaw<CatalogTable[]>`
        SELECT schemaname, tablename FROM pg_catalog.pg_tables
        WHERE schemaname IN (${Prisma.join(TEST_APPLICATION_SCHEMAS)})
          AND tablename <> ${"_prisma_migrations"}
        ORDER BY schemaname, tablename LIMIT 101
      `;
          const counts: TestTableSummary["tables"] = [];
          for (const table of tables.slice(0, 100)) {
            const qualified = Prisma.raw(
              `${identifier(table.schemaname)}.${identifier(table.tablename)}`,
            );
            const result = await tx.$queryRaw<Array<{ rows: string }>>(
              Prisma.sql`SELECT COUNT(*)::text AS rows FROM ${qualified}`,
            );
            counts.push({ schema: table.schemaname, table: table.tablename, rows: result[0].rows });
          }
          return {
            scope: "selected-test-database-application-tables",
            tablesTruncated: tables.length > 100,
            tables: counts,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 10_000 },
      ),
    report,
  );
}

/** Existence only, not connectivity/readiness; never enumerate unrelated database names. */
export async function inspectSelectedTestDatabase(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: { scope: "selected-test-database"; exists: boolean }) => void,
): Promise<void> {
  const { url, database } = requireTestDatabaseAdmin(env);
  // Shared lifecycle rechecks the selected test target; the client uses its validated maintenance URL.
  await runDatabaseInspection(
    env,
    () => createClient(url),
    async (prisma) => {
      const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_database
        WHERE datname = ${database} AND NOT datistemplate) AS exists
    `;
      return { scope: "selected-test-database" as const, exists: rows[0].exists };
    },
    report,
  );
}

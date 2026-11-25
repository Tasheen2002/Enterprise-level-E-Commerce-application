import type { PrismaClient } from "@prisma/client";
import { PrismaRepositoryHelper } from "../../src/shared/infrastructure/persistence";

// Compile-only contracts: no client construction or database operation is executed.
export function persistenceHelperContracts(prisma: PrismaClient) {
  const userIds: Promise<{ items: string[] }> = PrismaRepositoryHelper.paginate(
    prisma.user,
    { select: { id: true }, where: { status: "active" }, orderBy: { id: "asc" } },
    (record: { id: string }) => record.id,
  );
  const stockIds = PrismaRepositoryHelper.paginate(
    prisma.inventoryStock,
    {},
    (record: { variantId: string }) => record.variantId,
  );
  PrismaRepositoryHelper.paginate(
    // @ts-expect-error The mapper input must be compatible with the selected record.
    prisma.user,
    { select: { id: true } },
    (record: { missing: string }) => record.missing,
  );
  PrismaRepositoryHelper.paginate(
    // @ts-expect-error Prisma query fields must belong to the model.
    prisma.user,
    { select: { nonexistent: true } },
    (record: { id: string }) => record.id,
  );
  PrismaRepositoryHelper.paginate(
    // @ts-expect-error An existing model field is unavailable when excluded by select.
    prisma.user,
    { select: { id: true } },
    (record: { email: string }) => record.email,
  );
  return { userIds, stockIds };
}

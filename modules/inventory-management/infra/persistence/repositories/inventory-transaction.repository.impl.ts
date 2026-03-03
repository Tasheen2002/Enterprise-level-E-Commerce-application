import { PrismaClient } from "@prisma/client";
import { InventoryTransaction } from "../../../domain/entities/inventory-transaction.entity";
import { TransactionId } from "../../../domain/value-objects/transaction-id.vo";
import { TransactionReasonVO } from "../../../domain/value-objects/transaction-reason.vo";
import { IInventoryTransactionRepository } from "../../../domain/repositories/inventory-transaction.repository";

interface InventoryTransactionDatabaseRow {
  invTxnId: string;
  variantId: string;
  locationId: string;
  qtyDelta: number;
  reason: string;

  referenceId: string | null;
  createdAt: Date;
}

export class InventoryTransactionRepositoryImpl implements IInventoryTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}
  private toEntity(row: InventoryTransactionDatabaseRow): InventoryTransaction {
    return InventoryTransaction.reconstitute({
      invTxnId: TransactionId.create(row.invTxnId),
      variantId: row.variantId,
      locationId: row.locationId,
      qtyDelta: row.qtyDelta,
      reason: TransactionReasonVO.create(row.reason),

      referenceId: row.referenceId || undefined,
      createdAt: row.createdAt,
    });
  }

  async save(transaction: InventoryTransaction): Promise<void> {
    await (this.prisma as any).inventoryTransaction.create({
      data: {
        invTxnId: transaction.getInvTxnId().getValue(),
        variantId: transaction.getVariantId(),
        locationId: transaction.getLocationId(),
        qtyDelta: transaction.getQtyDelta(),
        reason: transaction.getReason().getValue(),

        referenceId: transaction.getReferenceId(),
        createdAt: transaction.getCreatedAt(),
      },
    });
  }

  async findById(
    invTxnId: TransactionId,
  ): Promise<InventoryTransaction | null> {
    const transaction = await (
      this.prisma as any
    ).inventoryTransaction.findUnique({
      where: { invTxnId: invTxnId.getValue() },
    });

    if (!transaction) {
      return null;
    }

    return this.toEntity(transaction as InventoryTransactionDatabaseRow);
  }

  async findByVariant(
    variantId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransaction[]; total: number }> {
    const { limit = 50, offset = 0 } = options || {};

    const [transactions, total] = await Promise.all([
      (this.prisma as any).inventoryTransaction.findMany({
        where: { variantId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      (this.prisma as any).inventoryTransaction.count({ where: { variantId } }),
    ]);

    return {
      transactions: transactions.map((txn: InventoryTransactionDatabaseRow) =>
        this.toEntity(txn),
      ),
      total,
    };
  }

  async findByLocation(
    locationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransaction[]; total: number }> {
    const { limit = 50, offset = 0 } = options || {};

    const [transactions, total] = await Promise.all([
      (this.prisma as any).inventoryTransaction.findMany({
        where: { locationId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      (this.prisma as any).inventoryTransaction.count({
        where: { locationId },
      }),
    ]);

    return {
      transactions: transactions.map((txn: InventoryTransactionDatabaseRow) =>
        this.toEntity(txn),
      ),
      total,
    };
  }

  async findByVariantAndLocation(
    variantId: string,
    locationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ transactions: InventoryTransaction[]; total: number }> {
    const { limit = 50, offset = 0 } = options || {};

    const [transactions, total] = await Promise.all([
      (this.prisma as any).inventoryTransaction.findMany({
        where: { variantId, locationId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      (this.prisma as any).inventoryTransaction.count({
        where: { variantId, locationId },
      }),
    ]);

    return {
      transactions: transactions.map((txn: InventoryTransactionDatabaseRow) =>
        this.toEntity(txn),
      ),
      total,
    };
  }

  async findByReference(referenceId: string): Promise<InventoryTransaction[]> {
    const transactions = await (
      this.prisma as any
    ).inventoryTransaction.findMany({
      where: { referenceId },
      orderBy: { createdAt: "desc" },
    });

    return transactions.map((txn: InventoryTransactionDatabaseRow) =>
      this.toEntity(txn),
    );
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    sortBy?: "createdAt";
    sortOrder?: "asc" | "desc";
  }): Promise<{ transactions: InventoryTransaction[]; total: number }> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const [transactions, total] = await Promise.all([
      (this.prisma as any).inventoryTransaction.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      (this.prisma as any).inventoryTransaction.count(),
    ]);

    return {
      transactions: transactions.map((txn: InventoryTransactionDatabaseRow) =>
        this.toEntity(txn),
      ),
      total,
    };
  }
}

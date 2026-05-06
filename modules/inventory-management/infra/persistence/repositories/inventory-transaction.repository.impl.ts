import { Prisma, PrismaClient, InvTxnReasonEnum } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { VariantId } from "../../../../product-catalog/domain/value-objects/variant-id.vo";
import { InventoryTransaction } from "../../../domain/entities/inventory-transaction.entity";
import { TransactionId } from "../../../domain/value-objects/transaction-id.vo";
import { TransactionReasonVO } from "../../../domain/value-objects/transaction-reason.vo";
import { LocationId } from "../../../domain/value-objects/location-id.vo";
import {
  IInventoryTransactionRepository,
  InventoryTransactionPageOptions,
  InventoryTransactionQueryOptions,
} from "../../../domain/repositories/inventory-transaction.repository";

export class InventoryTransactionRepositoryImpl
  extends PrismaRepository<InventoryTransaction>
  implements IInventoryTransactionRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(
    row: Prisma.InventoryTransactionGetPayload<object>,
  ): InventoryTransaction {
    return InventoryTransaction.fromPersistence({
      invTxnId: TransactionId.fromString(row.invTxnId),
      variantId: row.variantId,
      locationId: row.locationId,
      qtyDelta: row.qtyDelta,
      reason: TransactionReasonVO.create(row.reason),
      referenceId: row.referenceId ?? undefined,
      createdAt: row.createdAt,
    });
  }

  async save(transaction: InventoryTransaction): Promise<void> {
    await this.prisma.inventoryTransaction.create({
      data: {
        invTxnId: transaction.invTxnId.getValue(),
        variantId: transaction.variantId,
        locationId: transaction.locationId,
        qtyDelta: transaction.qtyDelta,
        reason: transaction.reason.getValue() as InvTxnReasonEnum,
        referenceId: transaction.referenceId ?? null,
        createdAt: transaction.createdAt,
      },
    });

    await this.dispatchEvents(transaction);
  }

  async findById(invTxnId: TransactionId): Promise<InventoryTransaction | null> {
    const row = await this.prisma.inventoryTransaction.findUnique({
      where: { invTxnId: invTxnId.getValue() },
    });

    return row ? this.toEntity(row) : null;
  }

  async findByVariant(
    variantId: VariantId,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>> {
    const { limit = 50, offset = 0 } = options || {};
    const variantIdValue = variantId.getValue();

    const [rows, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: { variantId: variantIdValue },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.inventoryTransaction.count({ where: { variantId: variantIdValue } }),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async findByLocation(
    locationId: LocationId,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>> {
    const { limit = 50, offset = 0 } = options || {};
    const locationIdValue = locationId.getValue();

    const [rows, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: { locationId: locationIdValue },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.inventoryTransaction.count({ where: { locationId: locationIdValue } }),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async findByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
    options?: InventoryTransactionPageOptions,
  ): Promise<PaginatedResult<InventoryTransaction>> {
    const { limit = 50, offset = 0 } = options || {};
    const where = { variantId: variantId.getValue(), locationId: locationId.getValue() };

    const [rows, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async findByReference(referenceId: string): Promise<InventoryTransaction[]> {
    const rows = await this.prisma.inventoryTransaction.findMany({
      where: { referenceId },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findAll(
    options?: InventoryTransactionQueryOptions,
  ): Promise<PaginatedResult<InventoryTransaction>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const [rows, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.inventoryTransaction.count(),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }
}

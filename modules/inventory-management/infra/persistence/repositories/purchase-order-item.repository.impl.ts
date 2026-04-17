import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../../../domain/value-objects/purchase-order-id.vo";
import { IPurchaseOrderItemRepository } from "../../../domain/repositories/purchase-order-item.repository";

interface PurchaseOrderItemDatabaseRow {
  poId: string;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
}

export class PurchaseOrderItemRepositoryImpl extends PrismaRepository<PurchaseOrderItem> implements IPurchaseOrderItemRepository {
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: PurchaseOrderItemDatabaseRow): PurchaseOrderItem {
    return PurchaseOrderItem.fromPersistence({
      poId: PurchaseOrderId.fromString(row.poId),
      variantId: row.variantId,
      orderedQty: row.orderedQty,
      receivedQty: row.receivedQty,
    });
  }

  async save(item: PurchaseOrderItem): Promise<void> {
    await (this.prisma as any).purchaseOrderItem.upsert({
      where: {
        poId_variantId: {
          poId: item.poId.getValue(),
          variantId: item.variantId,
        },
      },
      create: {
        poId: item.poId.getValue(),
        variantId: item.variantId,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
      },
      update: {
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
      },
    });

    await this.dispatchEvents(item);
  }

  async findByPoAndVariant(
    poId: PurchaseOrderId,
    variantId: string,
  ): Promise<PurchaseOrderItem | null> {
    const item = await (this.prisma as any).purchaseOrderItem.findUnique({
      where: {
        poId_variantId: {
          poId: poId.getValue(),
          variantId,
        },
      },
    });

    if (!item) {
      return null;
    }

    return this.toEntity(item as PurchaseOrderItemDatabaseRow);
  }

  async delete(poId: PurchaseOrderId, variantId: string): Promise<void> {
    await (this.prisma as any).purchaseOrderItem.delete({
      where: {
        poId_variantId: {
          poId: poId.getValue(),
          variantId,
        },
      },
    });
  }

  async findByPurchaseOrder(
    poId: PurchaseOrderId,
  ): Promise<PurchaseOrderItem[]> {
    const items = await (this.prisma as any).purchaseOrderItem.findMany({
      where: { poId: poId.getValue() },
      orderBy: { variantId: "asc" },
    });

    return items.map((item: PurchaseOrderItemDatabaseRow) =>
      this.toEntity(item),
    );
  }

  async findByVariant(variantId: string): Promise<PurchaseOrderItem[]> {
    const items = await (this.prisma as any).purchaseOrderItem.findMany({
      where: { variantId },
      orderBy: { poId: "desc" },
    });

    return items.map((item: PurchaseOrderItemDatabaseRow) =>
      this.toEntity(item),
    );
  }

  async findPendingItemsByPO(
    poId: PurchaseOrderId,
  ): Promise<PurchaseOrderItem[]> {
    const items = await (this.prisma as any).purchaseOrderItem.findMany({
      where: { poId: poId.getValue() },
      orderBy: { variantId: "asc" },
    });

    return items
      .filter(
        (item: PurchaseOrderItemDatabaseRow) =>
          item.receivedQty < item.orderedQty,
      )
      .map((item: PurchaseOrderItemDatabaseRow) => this.toEntity(item));
  }

  async findFullyReceivedItemsByPO(
    poId: PurchaseOrderId,
  ): Promise<PurchaseOrderItem[]> {
    const items = await (this.prisma as any).purchaseOrderItem.findMany({
      where: { poId: poId.getValue() },
      orderBy: { variantId: "asc" },
    });

    return items
      .filter(
        (item: PurchaseOrderItemDatabaseRow) =>
          item.receivedQty === item.orderedQty,
      )
      .map((item: PurchaseOrderItemDatabaseRow) => this.toEntity(item));
  }

  async getTotalOrderedQty(poId: PurchaseOrderId): Promise<number> {
    const result = await (this.prisma as any).purchaseOrderItem.aggregate({
      where: { poId: poId.getValue() },
      _sum: { orderedQty: true },
    });

    return result._sum.orderedQty || 0;
  }

  async getTotalReceivedQty(poId: PurchaseOrderId): Promise<number> {
    const result = await (this.prisma as any).purchaseOrderItem.aggregate({
      where: { poId: poId.getValue() },
      _sum: { receivedQty: true },
    });

    return result._sum.receivedQty || 0;
  }

  async exists(poId: PurchaseOrderId, variantId: string): Promise<boolean> {
    const count = await (this.prisma as any).purchaseOrderItem.count({
      where: {
        poId: poId.getValue(),
        variantId,
      },
    });

    return count > 0;
  }
}

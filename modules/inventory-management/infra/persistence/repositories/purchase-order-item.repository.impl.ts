import { PrismaClient } from "@prisma/client";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../../../domain/value-objects/purchase-order-id.vo";
import { IPurchaseOrderItemRepository } from "../../../domain/repositories/purchase-order-item.repository";

export class PurchaseOrderItemRepositoryImpl
  implements IPurchaseOrderItemRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: {
    poId: string;
    variantId: string;
    orderedQty: number;
    receivedQty: number;
  }): PurchaseOrderItem {
    return PurchaseOrderItem.fromPersistence({
      poId: PurchaseOrderId.fromString(row.poId),
      variantId: row.variantId,
      orderedQty: row.orderedQty,
      receivedQty: row.receivedQty,
    });
  }

  async save(item: PurchaseOrderItem): Promise<void> {
    await this.prisma.purchaseOrderItem.upsert({
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
  }

  async findByPoAndVariant(
    poId: PurchaseOrderId,
    variantId: string,
  ): Promise<PurchaseOrderItem | null> {
    const row = await this.prisma.purchaseOrderItem.findUnique({
      where: {
        poId_variantId: {
          poId: poId.getValue(),
          variantId,
        },
      },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(poId: PurchaseOrderId, variantId: string): Promise<void> {
    await this.prisma.purchaseOrderItem.delete({
      where: {
        poId_variantId: {
          poId: poId.getValue(),
          variantId,
        },
      },
    });
  }

  async findByPurchaseOrder(poId: PurchaseOrderId): Promise<PurchaseOrderItem[]> {
    const rows = await this.prisma.purchaseOrderItem.findMany({
      where: { poId: poId.getValue() },
      orderBy: { variantId: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByVariant(variantId: string): Promise<PurchaseOrderItem[]> {
    const rows = await this.prisma.purchaseOrderItem.findMany({
      where: { variantId },
      orderBy: { poId: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findPendingItemsByPO(poId: PurchaseOrderId): Promise<PurchaseOrderItem[]> {
    const rows = await this.prisma.purchaseOrderItem.findMany({
      where: { poId: poId.getValue() },
      orderBy: { variantId: "asc" },
    });

    return rows
      .filter((r) => r.receivedQty < r.orderedQty)
      .map((r) => this.toEntity(r));
  }

  async findFullyReceivedItemsByPO(poId: PurchaseOrderId): Promise<PurchaseOrderItem[]> {
    const rows = await this.prisma.purchaseOrderItem.findMany({
      where: { poId: poId.getValue() },
      orderBy: { variantId: "asc" },
    });

    return rows
      .filter((r) => r.receivedQty === r.orderedQty)
      .map((r) => this.toEntity(r));
  }

  async getTotalOrderedQty(poId: PurchaseOrderId): Promise<number> {
    const result = await this.prisma.purchaseOrderItem.aggregate({
      where: { poId: poId.getValue() },
      _sum: { orderedQty: true },
    });

    return result._sum.orderedQty ?? 0;
  }

  async getTotalReceivedQty(poId: PurchaseOrderId): Promise<number> {
    const result = await this.prisma.purchaseOrderItem.aggregate({
      where: { poId: poId.getValue() },
      _sum: { receivedQty: true },
    });

    return result._sum.receivedQty ?? 0;
  }

  async exists(poId: PurchaseOrderId, variantId: string): Promise<boolean> {
    const count = await this.prisma.purchaseOrderItem.count({
      where: {
        poId: poId.getValue(),
        variantId,
      },
    });

    return count > 0;
  }
}

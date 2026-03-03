import { PrismaClient } from "@prisma/client";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../../../domain/value-objects/purchase-order-id.vo";
import { IPurchaseOrderItemRepository } from "../../../domain/repositories/purchase-order-item.repository";

interface PurchaseOrderItemDatabaseRow {
  poId: string;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
}

export class PurchaseOrderItemRepositoryImpl implements IPurchaseOrderItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: PurchaseOrderItemDatabaseRow): PurchaseOrderItem {
    return PurchaseOrderItem.reconstitute({
      poId: PurchaseOrderId.create(row.poId),
      variantId: row.variantId,
      orderedQty: row.orderedQty,
      receivedQty: row.receivedQty,
    });
  }

  async save(item: PurchaseOrderItem): Promise<void> {
    await (this.prisma as any).purchaseOrderItem.upsert({
      where: {
        poId_variantId: {
          poId: item.getPoId().getValue(),
          variantId: item.getVariantId(),
        },
      },
      create: {
        poId: item.getPoId().getValue(),
        variantId: item.getVariantId(),
        orderedQty: item.getOrderedQty(),
        receivedQty: item.getReceivedQty(),
      },
      update: {
        orderedQty: item.getOrderedQty(),
        receivedQty: item.getReceivedQty(),
      },
    });
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
    const rows = await this.prisma.$queryRaw<
      { po_id: string; variant_id: string; ordered_qty: number; received_qty: number }[]
    >`
      SELECT * FROM inventory_management.purchase_order_items
      WHERE po_id = ${poId.getValue()}
      AND received_qty < ordered_qty
      ORDER BY variant_id ASC
    `;

    return rows.map((r) =>
      this.toEntity({
        poId: r.po_id,
        variantId: r.variant_id,
        orderedQty: r.ordered_qty,
        receivedQty: r.received_qty,
      }),
    );
  }

  async findFullyReceivedItemsByPO(
    poId: PurchaseOrderId,
  ): Promise<PurchaseOrderItem[]> {
    const rows = await this.prisma.$queryRaw<
      { po_id: string; variant_id: string; ordered_qty: number; received_qty: number }[]
    >`
      SELECT * FROM inventory_management.purchase_order_items
      WHERE po_id = ${poId.getValue()}
      AND received_qty = ordered_qty
      ORDER BY variant_id ASC
    `;

    return rows.map((r) =>
      this.toEntity({
        poId: r.po_id,
        variantId: r.variant_id,
        orderedQty: r.ordered_qty,
        receivedQty: r.received_qty,
      }),
    );
  }

  async getTotalOrderedQty(poId: PurchaseOrderId): Promise<number> {
    const result = await (this.prisma as any).purchaseOrderItem.aggregate({
      where: { poId: poId.getValue() },
      _sum: {
        orderedQty: true,
      },
    });

    return result._sum.orderedQty || 0;
  }

  async getTotalReceivedQty(poId: PurchaseOrderId): Promise<number> {
    const result = await (this.prisma as any).purchaseOrderItem.aggregate({
      where: { poId: poId.getValue() },
      _sum: {
        receivedQty: true,
      },
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

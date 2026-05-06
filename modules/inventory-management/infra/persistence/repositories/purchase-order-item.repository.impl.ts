import { PrismaClient } from "@prisma/client";
import { VariantId } from "../../../../product-catalog/domain/value-objects/variant-id.vo";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../../../domain/value-objects/purchase-order-id.vo";
import { IPurchaseOrderItemRepository } from "../../../domain/repositories/purchase-order-item.repository";

// Read-only cross-aggregate query repository. Writes flow through
// `IPurchaseOrderRepository.save()` after mutating items via the
// `PurchaseOrder` aggregate root.
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

  async findByVariant(variantId: VariantId): Promise<PurchaseOrderItem[]> {
    const rows = await this.prisma.purchaseOrderItem.findMany({
      where: { variantId: variantId.getValue() },
      orderBy: { poId: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
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
}

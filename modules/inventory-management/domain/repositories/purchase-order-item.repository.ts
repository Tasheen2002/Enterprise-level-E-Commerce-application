import { PurchaseOrderItem } from "../entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";

export interface IPurchaseOrderItemRepository {
  save(item: PurchaseOrderItem): Promise<void>;
  findByPoAndVariant(
    poId: PurchaseOrderId,
    variantId: string,
  ): Promise<PurchaseOrderItem | null>;
  delete(poId: PurchaseOrderId, variantId: string): Promise<void>;
  findByPurchaseOrder(poId: PurchaseOrderId): Promise<PurchaseOrderItem[]>;
  findByVariant(variantId: string): Promise<PurchaseOrderItem[]>;
  findPendingItemsByPO(poId: PurchaseOrderId): Promise<PurchaseOrderItem[]>;
  findFullyReceivedItemsByPO(
    poId: PurchaseOrderId,
  ): Promise<PurchaseOrderItem[]>;
  getTotalOrderedQty(poId: PurchaseOrderId): Promise<number>;
  getTotalReceivedQty(poId: PurchaseOrderId): Promise<number>;
  exists(poId: PurchaseOrderId, variantId: string): Promise<boolean>;
}

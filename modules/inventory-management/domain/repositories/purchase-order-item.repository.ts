import { PurchaseOrderItem } from "../entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";

export interface IPurchaseOrderItemRepository {
  // Basic CRUD
  save(item: PurchaseOrderItem): Promise<void>;
  findByPoAndVariant(
    poId: PurchaseOrderId,
    variantId: string,
  ): Promise<PurchaseOrderItem | null>;
  delete(poId: PurchaseOrderId, variantId: string): Promise<void>;

  // Queries
  findByPurchaseOrder(poId: PurchaseOrderId): Promise<PurchaseOrderItem[]>;
  findByVariant(variantId: string): Promise<PurchaseOrderItem[]>;

  // Specific queries
  findPendingItemsByPO(poId: PurchaseOrderId): Promise<PurchaseOrderItem[]>;
  findFullyReceivedItemsByPO(
    poId: PurchaseOrderId,
  ): Promise<PurchaseOrderItem[]>;

  // Aggregate queries
  getTotalOrderedQty(poId: PurchaseOrderId): Promise<number>;
  getTotalReceivedQty(poId: PurchaseOrderId): Promise<number>;

  // Existence checks
  exists(poId: PurchaseOrderId, variantId: string): Promise<boolean>;
}

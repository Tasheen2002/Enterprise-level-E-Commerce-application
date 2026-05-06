import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { PurchaseOrderItem } from "../entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../value-objects/purchase-order-id.vo";

export interface IPurchaseOrderItemRepository {
  findByVariant(variantId: VariantId): Promise<PurchaseOrderItem[]>;
  getTotalOrderedQty(poId: PurchaseOrderId): Promise<number>;
  getTotalReceivedQty(poId: PurchaseOrderId): Promise<number>;
}

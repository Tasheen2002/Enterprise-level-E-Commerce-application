import { ICommand } from "@/api/src/shared/application";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";

export interface ReceivePOItemsCommand extends ICommand {
  poId: string;
  locationId: string;
  items: { variantId: string; receivedQty: number }[];
}

export interface ReceivePOItemsResult {
  purchaseOrder: PurchaseOrder;
  items: PurchaseOrderItem[];
}

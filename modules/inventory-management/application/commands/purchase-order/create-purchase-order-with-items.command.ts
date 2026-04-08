import { ICommand } from "@/api/src/shared/application";

export interface CreatePurchaseOrderWithItemsCommand extends ICommand {
  supplierId: string;
  eta?: Date;
  items: Array<{ variantId: string; orderedQty: number }>;
}

export interface CreatePurchaseOrderWithItemsResult {
  purchaseOrder: {
    poId: string;
    supplierId: string;
    eta?: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  items: Array<{
    variantId: string;
    orderedQty: number;
  }>;
}

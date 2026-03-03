import { IQuery } from "@/api/src/shared/application";
import { PurchaseOrderResult } from "./get-purchase-order.query";

export interface ListPurchaseOrdersQuery extends IQuery {
  limit?: number;
  offset?: number;
  status?: string;
  supplierId?: string;
  sortBy?: "createdAt" | "updatedAt" | "eta";
  sortOrder?: "asc" | "desc";
}

export interface ListPurchaseOrdersResult {
  purchaseOrders: PurchaseOrderResult[];
  total: number;
}

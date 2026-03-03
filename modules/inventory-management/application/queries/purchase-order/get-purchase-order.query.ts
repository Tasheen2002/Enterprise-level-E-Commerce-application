import { IQuery } from "@/api/src/shared/application";

export interface GetPurchaseOrderQuery extends IQuery {
  poId: string;
}

export interface PurchaseOrderResult {
  poId: string;
  supplierId: string;
  eta?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

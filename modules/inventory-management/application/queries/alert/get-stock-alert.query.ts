import { IQuery } from "@/api/src/shared/application";

export interface GetStockAlertQuery extends IQuery {
  alertId: string;
}

export interface StockAlertResult {
  alertId: string;
  variantId: string;
  type: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
}

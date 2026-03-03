import { IQuery } from "@/api/src/shared/application";
import { StockAlertResult } from "./get-stock-alert.query";

export interface ListStockAlertsQuery extends IQuery {
  limit?: number;
  offset?: number;
  includeResolved?: boolean;
}

export interface ListStockAlertsResult {
  alerts: StockAlertResult[];
  total: number;
}

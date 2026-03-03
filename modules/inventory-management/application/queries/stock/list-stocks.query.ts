import { IQuery } from "@/api/src/shared/application";
import { StockResult } from "./get-stock.query";

export interface ListStocksQuery extends IQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "low_stock" | "out_of_stock" | "in_stock";
  locationId?: string;
  sortBy?: "available" | "onHand" | "location" | "product";
  sortOrder?: "asc" | "desc";
}

export interface ListStocksResult {
  stocks: StockResult[];
  total: number;
}

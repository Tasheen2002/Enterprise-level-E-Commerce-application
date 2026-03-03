import { IQuery } from "@/api/src/shared/application";

export interface GetStockStatsQuery extends IQuery {}

export interface StockStatsResult {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

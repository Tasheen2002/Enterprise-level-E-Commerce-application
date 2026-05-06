import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockManagementService } from "../services/stock-management.service";

export interface GetStockStatsQuery extends IQuery {}

export interface StockStatsResult {
  readonly totalItems: number;
  readonly lowStockCount: number;
  readonly outOfStockCount: number;
  readonly totalValue: number;
}

export class GetStockStatsHandler implements IQueryHandler<
  GetStockStatsQuery,
  StockStatsResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(_query: GetStockStatsQuery): Promise<StockStatsResult> {
    return this.stockService.getStats();
  }
}

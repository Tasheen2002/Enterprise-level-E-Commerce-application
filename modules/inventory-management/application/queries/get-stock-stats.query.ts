import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { StockManagementService } from "../services/stock-management.service";

export interface GetStockStatsQuery extends IQuery {}

export interface StockStatsResult {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export class GetStockStatsHandler implements IQueryHandler<
  GetStockStatsQuery,
  QueryResult<StockStatsResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(_query: GetStockStatsQuery): Promise<QueryResult<StockStatsResult>> {
    const stats = await this.stockService.getStats();
    return QueryResult.success(stats);
  }
}

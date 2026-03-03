import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetStockStatsQuery, StockStatsResult } from "./get-stock-stats.query";
import { StockManagementService } from "../../services/stock-management.service";

export class GetStockStatsHandler implements IQueryHandler<
  GetStockStatsQuery,
  QueryResult<StockStatsResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetStockStatsQuery,
  ): Promise<QueryResult<StockStatsResult>> {
    try {
      const stats = await this.stockService.getStats();
      return QueryResult.success(stats);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}

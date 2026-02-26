import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetStockStatsQuery extends IQuery {}

export class GetStockStatsHandler implements IQueryHandler<
  GetStockStatsQuery,
  QueryResult<{ totalItems: number; lowStockCount: number; outOfStockCount: number; totalValue: number }>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetStockStatsQuery): Promise<QueryResult<{ totalItems: number; lowStockCount: number; outOfStockCount: number; totalValue: number }>> {
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

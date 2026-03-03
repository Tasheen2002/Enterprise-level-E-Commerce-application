import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GetTotalAvailableStockQuery,
  TotalAvailableStockResult,
} from "./get-total-available-stock.query";
import { StockManagementService } from "../../services/stock-management.service";

export class GetTotalAvailableStockHandler implements IQueryHandler<
  GetTotalAvailableStockQuery,
  QueryResult<TotalAvailableStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTotalAvailableStockQuery,
  ): Promise<QueryResult<TotalAvailableStockResult>> {
    try {
      const totalAvailable = await this.stockService.getTotalAvailableStock(
        query.variantId,
      );

      const result: TotalAvailableStockResult = {
        variantId: query.variantId,
        totalAvailable,
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}

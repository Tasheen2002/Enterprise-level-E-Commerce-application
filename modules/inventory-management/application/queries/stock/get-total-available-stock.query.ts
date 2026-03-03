import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetTotalAvailableStockQuery extends IQuery {
  variantId: string;
}

export interface TotalAvailableStockResult {
  variantId: string;
  totalAvailable: number;
}

export class GetTotalAvailableStockHandler implements IQueryHandler<
  GetTotalAvailableStockQuery,
  QueryResult<TotalAvailableStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTotalAvailableStockQuery,
  ): Promise<QueryResult<TotalAvailableStockResult>> {
    try {
      if (!query.variantId || query.variantId.trim().length === 0) {
        return QueryResult.failure("variantId: Variant ID is required");
      }

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

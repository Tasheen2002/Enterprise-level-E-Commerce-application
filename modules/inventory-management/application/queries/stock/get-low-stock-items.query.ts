import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { StockResult } from "./get-stock.query";

export interface GetLowStockItemsQuery extends IQuery {}

export class GetLowStockItemsHandler implements IQueryHandler<
  GetLowStockItemsQuery,
  QueryResult<StockResult[]>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetLowStockItemsQuery,
  ): Promise<QueryResult<StockResult[]>> {
    try {
      const stocks = await this.stockService.getLowStockItems();

      const results: StockResult[] = stocks.map((stock) => {
        const stockLevel = stock.getStockLevel();
        return {
          variantId: stock.getVariantId(),
          locationId: stock.getLocationId(),
          onHand: stockLevel.getOnHand(),
          reserved: stockLevel.getReserved(),
          available: stockLevel.getAvailable(),
          lowStockThreshold: stockLevel.getLowStockThreshold() ?? undefined,
          safetyStock: stockLevel.getSafetyStock() ?? undefined,
          isLowStock: stockLevel.isLowStock(),
          isOutOfStock: stockLevel.isOutOfStock(),
        };
      });

      return QueryResult.success(results);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}

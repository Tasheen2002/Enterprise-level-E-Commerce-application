import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetStockQuery, StockResult } from "./get-stock.query";
import { StockManagementService } from "../../services/stock-management.service";

export class GetStockHandler implements IQueryHandler<
  GetStockQuery,
  QueryResult<StockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetStockQuery): Promise<QueryResult<StockResult>> {
    try {
      const stock = await this.stockService.getStock(
        query.variantId,
        query.locationId,
      );

      const stockLevel = stock.getStockLevel();
      const result: StockResult = {
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

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
    }
  }
}

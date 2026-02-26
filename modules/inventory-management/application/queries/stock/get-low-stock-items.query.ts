import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { StockResult } from "./get-stock.query";

export interface GetLowStockItemsQuery extends IQuery {}

export class GetLowStockItemsQueryHandler implements IQueryHandler<
  GetLowStockItemsQuery,
  CommandResult<StockResult[]>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetLowStockItemsQuery,
  ): Promise<CommandResult<StockResult[]>> {
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

      return CommandResult.success(results);
    } catch (error) {
      return CommandResult.failure<StockResult[]>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { GetLowStockItemsQueryHandler as GetLowStockItemsHandler };

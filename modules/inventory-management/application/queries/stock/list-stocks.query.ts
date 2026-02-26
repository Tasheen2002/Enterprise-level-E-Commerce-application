import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { StockResult } from "./get-stock.query";

export interface ListStocksQuery extends IQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "low_stock" | "out_of_stock" | "in_stock";
  locationId?: string;
  sortBy?: "available" | "onHand" | "location" | "product";
  sortOrder?: "asc" | "desc";
}

export interface ListStocksResult {
  stocks: StockResult[];
  total: number;
}

export class ListStocksHandler implements IQueryHandler<
  ListStocksQuery,
  QueryResult<ListStocksResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: ListStocksQuery,
  ): Promise<QueryResult<ListStocksResult>> {
    try {
      const result = await this.stockService.listStocks({
        limit: query.limit,
        offset: query.offset,
        search: query.search,
        status: query.status,
        locationId: query.locationId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      const stocks: StockResult[] = result.stocks.map((stock) => {
        const stockLevel = stock.getStockLevel();
        return {
          stockId: `${stock.getVariantId()}-${stock.getLocationId()}`,
          variantId: stock.getVariantId(),
          locationId: stock.getLocationId(),
          onHand: stockLevel.getOnHand(),
          reserved: stockLevel.getReserved(),
          available: stockLevel.getAvailable(),
          lowStockThreshold: stockLevel.getLowStockThreshold() ?? undefined,
          safetyStock: stockLevel.getSafetyStock() ?? undefined,
          isLowStock: stockLevel.isLowStock(),
          isOutOfStock: stockLevel.isOutOfStock(),
          variant: {
            ...stock.getVariant(),
            size: stock.getVariant()?.size,
            color: stock.getVariant()?.color,
          },
          location: stock.getLocation(),
        };
      });

      return QueryResult.success({
        stocks,
        total: result.total,
      });
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}

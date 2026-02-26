import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";

export interface GetStockQuery extends IQuery {
  variantId: string;
  locationId: string;
}

export interface StockResult {
  stockId?: string;
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold?: number;
  safetyStock?: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  variant?: any;
  location?: any;
}

export class GetStockHandler implements IQueryHandler<
  GetStockQuery,
  QueryResult<StockResult | null>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetStockQuery,
  ): Promise<QueryResult<StockResult | null>> {
    try {
      if (!query.variantId || query.variantId.trim().length === 0) {
        return QueryResult.failure("variantId: Variant ID is required");
      }

      if (!query.locationId || query.locationId.trim().length === 0) {
        return QueryResult.failure("locationId: Location ID is required");
      }

      const stock = await this.stockService.getStock(
        query.variantId,
        query.locationId,
      );

      if (!stock) {
        return QueryResult.success<StockResult | null>(null);
      }

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

import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { Stock } from "../entities/stock.entity";
import { LocationId } from "../value-objects/location-id.vo";
import { StockId } from "../value-objects/stock-id.vo";

export interface IStockRepository {
  save(stock: Stock): Promise<void>;
  findByStockId(stockId: StockId): Promise<Stock | null>;
  findByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
  ): Promise<Stock | null>;
  delete(stockId: StockId): Promise<void>;
  findByVariant(variantId: VariantId): Promise<Stock[]>;
  findByLocation(locationId: LocationId): Promise<Stock[]>;
  findAll(options?: StockQueryOptions): Promise<PaginatedResult<Stock>>;
  findLowStockItems(): Promise<Stock[]>;
  findOutOfStockItems(): Promise<Stock[]>;
  getTotalAvailableStock(variantId: VariantId): Promise<number>;
  exists(stockId: StockId): Promise<boolean>;
  getStats(): Promise<StockStats>;
}

export interface StockQueryOptions {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "low_stock" | "out_of_stock" | "in_stock";
  locationId?: LocationId;
  sortBy?: "available" | "onHand" | "location" | "product";
  sortOrder?: "asc" | "desc";
}

export interface StockStats {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

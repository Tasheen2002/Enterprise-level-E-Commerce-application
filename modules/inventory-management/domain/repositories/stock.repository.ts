import { Stock } from "../entities/stock.entity";

export interface IStockRepository {
  save(stock: Stock): Promise<void>;
  findByVariantAndLocation(
    variantId: string,
    locationId: string,
  ): Promise<Stock | null>;
  delete(variantId: string, locationId: string): Promise<void>;
  findByVariant(variantId: string): Promise<Stock[]>;
  findByLocation(locationId: string): Promise<Stock[]>;
  findAll(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: "low_stock" | "out_of_stock" | "in_stock";
    locationId?: string;
    sortBy?: "available" | "onHand" | "location" | "product";
    sortOrder?: "asc" | "desc";
  }): Promise<{ stocks: Stock[]; total: number }>;
  findLowStockItems(): Promise<Stock[]>;
  findOutOfStockItems(): Promise<Stock[]>;
  getTotalAvailableStock(variantId: string): Promise<number>;
  exists(variantId: string, locationId: string): Promise<boolean>;
  getStats(): Promise<{
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  }>;
}

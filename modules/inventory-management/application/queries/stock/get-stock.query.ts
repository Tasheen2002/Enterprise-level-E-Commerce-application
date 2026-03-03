import { IQuery } from "@/api/src/shared/application";

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

import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { StockAlert } from "../entities/stock-alert.entity";
import { AlertId } from "../value-objects/alert-id.vo";
import { AlertTypeVO } from "../value-objects/alert-type.vo";

export interface IStockAlertRepository {
  save(alert: StockAlert): Promise<void>;
  findById(alertId: AlertId): Promise<StockAlert | null>;
  delete(alertId: AlertId): Promise<void>;
  findByVariant(variantId: VariantId): Promise<StockAlert[]>;
  findActiveAlerts(): Promise<StockAlert[]>;
  findResolvedAlerts(): Promise<StockAlert[]>;
  findByType(type: AlertTypeVO): Promise<StockAlert[]>;
  findAll(options?: StockAlertQueryOptions): Promise<PaginatedResult<StockAlert>>;
  findActiveAlertsByVariant(variantId: VariantId): Promise<StockAlert[]>;
  hasActiveAlert(variantId: VariantId, type: AlertTypeVO): Promise<boolean>;
}

export interface StockAlertQueryOptions {
  limit?: number;
  offset?: number;
  includeResolved?: boolean;
}

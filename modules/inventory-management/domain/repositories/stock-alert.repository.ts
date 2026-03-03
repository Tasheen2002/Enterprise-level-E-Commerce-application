import { StockAlert } from "../entities/stock-alert.entity";
import { AlertId } from "../value-objects/alert-id.vo";
import { AlertType } from "../value-objects/alert-type.vo";

export interface IStockAlertRepository {
  save(alert: StockAlert): Promise<void>;
  findById(alertId: AlertId): Promise<StockAlert | null>;
  delete(alertId: AlertId): Promise<void>;
  findByVariant(variantId: string): Promise<StockAlert[]>;
  findActiveAlerts(): Promise<StockAlert[]>;
  findResolvedAlerts(): Promise<StockAlert[]>;
  findByType(type: AlertType): Promise<StockAlert[]>;

  findAll(options?: {
    limit?: number;
    offset?: number;
    includeResolved?: boolean;
  }): Promise<{ alerts: StockAlert[]; total: number }>;
  findActiveAlertsByVariant(variantId: string): Promise<StockAlert[]>;
  hasActiveAlert(variantId: string, type: AlertType): Promise<boolean>;
}

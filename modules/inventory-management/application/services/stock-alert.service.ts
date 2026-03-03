import { v4 as uuidv4 } from "uuid";
import { StockAlert } from "../../domain/entities/stock-alert.entity";
import { AlertId } from "../../domain/value-objects/alert-id.vo";
import {
  AlertType,
  AlertTypeVO,
} from "../../domain/value-objects/alert-type.vo";
import { IStockAlertRepository } from "../../domain/repositories/stock-alert.repository";
import { IStockRepository } from "../../domain/repositories/stock.repository";

export class StockAlertService {
  constructor(
    private readonly stockAlertRepository: IStockAlertRepository,
    private readonly stockRepository: IStockRepository,
  ) {}

  async createStockAlert(variantId: string, type: string): Promise<StockAlert> {
    const alertType = type.toLowerCase() as AlertType;

    // Check if there's already an active alert of this type for this variant
    const hasActiveAlert = await this.stockAlertRepository.hasActiveAlert(
      variantId,
      alertType,
    );

    if (hasActiveAlert) {
      throw new Error(
        `Active ${type} alert already exists for variant ${variantId}`,
      );
    }

    const alert = StockAlert.create({
      alertId: AlertId.create(uuidv4()),
      variantId,
      type: AlertTypeVO.create(type),
      triggeredAt: new Date(),
    });

    await this.stockAlertRepository.save(alert);
    return alert;
  }

  async resolveStockAlert(alertId: string): Promise<StockAlert> {
    const alert = await this.stockAlertRepository.findById(
      AlertId.create(alertId),
    );

    if (!alert) {
      throw new Error(`Alert with ID ${alertId} not found`);
    }

    if (alert.isResolved()) {
      throw new Error(`Alert ${alertId} is already resolved`);
    }

    const resolvedAlert = alert.resolve(new Date());
    await this.stockAlertRepository.save(resolvedAlert);
    return resolvedAlert;
  }

  async deleteStockAlert(alertId: string): Promise<void> {
    const alert = await this.stockAlertRepository.findById(
      AlertId.create(alertId),
    );

    if (!alert) {
      throw new Error(`Alert with ID ${alertId} not found`);
    }

    await this.stockAlertRepository.delete(AlertId.create(alertId));
  }

  async checkAndCreateAlerts(variantId: string): Promise<StockAlert[]> {
    const createdAlerts: StockAlert[] = [];

    // Get all stock records for this variant
    const stocks = await this.stockRepository.findByVariant(variantId);

    if (stocks.length === 0) {
      return createdAlerts;
    }

    // Calculate total available stock
    const totalAvailable = stocks.reduce(
      (sum, stock) => sum + stock.getStockLevel().getAvailable(),
      0,
    );

    // Check for out of stock
    if (totalAvailable === 0) {
      const hasActiveAlert = await this.stockAlertRepository.hasActiveAlert(
        variantId,
        AlertType.OOS,
      );

      if (!hasActiveAlert) {
        const alert = await this.createStockAlert(variantId, "oos");
        createdAlerts.push(alert);
      }
    }

    // Check for low stock across all locations
    const hasLowStock = stocks.some((stock) =>
      stock.getStockLevel().isLowStock(),
    );

    if (hasLowStock && totalAvailable > 0) {
      const hasActiveAlert = await this.stockAlertRepository.hasActiveAlert(
        variantId,
        AlertType.LOW_STOCK,
      );

      if (!hasActiveAlert) {
        const alert = await this.createStockAlert(variantId, "low_stock");
        createdAlerts.push(alert);
      }
    }

    return createdAlerts;
  }

  async autoResolveAlerts(variantId: string): Promise<StockAlert[]> {
    const resolvedAlerts: StockAlert[] = [];

    // Get active alerts for this variant
    const activeAlerts =
      await this.stockAlertRepository.findActiveAlertsByVariant(variantId);

    if (activeAlerts.length === 0) {
      return resolvedAlerts;
    }

    // Get current stock status
    const totalAvailable =
      await this.stockRepository.getTotalAvailableStock(variantId);
    const stocks = await this.stockRepository.findByVariant(variantId);
    const hasLowStock = stocks.some((stock) =>
      stock.getStockLevel().isLowStock(),
    );

    // Resolve alerts that are no longer applicable
    for (const alert of activeAlerts) {
      let shouldResolve = false;

      if (alert.getType().getValue() === AlertType.OOS && totalAvailable > 0) {
        shouldResolve = true;
      }

      if (alert.getType().getValue() === AlertType.LOW_STOCK && !hasLowStock) {
        shouldResolve = true;
      }

      if (shouldResolve) {
        const resolvedAlert = alert.resolve(new Date());
        await this.stockAlertRepository.save(resolvedAlert);
        resolvedAlerts.push(resolvedAlert);
      }
    }

    return resolvedAlerts;
  }

  async getStockAlert(alertId: string): Promise<StockAlert | null> {
    return this.stockAlertRepository.findById(AlertId.create(alertId));
  }

  async getActiveAlerts(): Promise<StockAlert[]> {
    return this.stockAlertRepository.findActiveAlerts();
  }

  async getAlertsByVariant(variantId: string): Promise<StockAlert[]> {
    return this.stockAlertRepository.findByVariant(variantId);
  }

  async listStockAlerts(options?: {
    limit?: number;
    offset?: number;
    includeResolved?: boolean;
  }): Promise<{ alerts: StockAlert[]; total: number }> {
    return this.stockAlertRepository.findAll(options);
  }
}

import { StockAlert, StockAlertDTO } from "../../domain/entities/stock-alert.entity";
import { AlertId } from "../../domain/value-objects/alert-id.vo";
import { AlertType } from "../../domain/value-objects/alert-type.vo";
import { IStockAlertRepository } from "../../domain/repositories/stock-alert.repository";
import { IStockRepository } from "../../domain/repositories/stock.repository";
import {
  StockAlertAlreadyExistsError,
  StockAlertNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/inventory-management.errors";

export class StockAlertService {
  constructor(
    private readonly stockAlertRepository: IStockAlertRepository,
    private readonly stockRepository: IStockRepository,
  ) {}

  async createStockAlert(variantId: string, type: string): Promise<StockAlertDTO> {
    const alertType = type.toLowerCase() as AlertType;

    const hasActiveAlert = await this.stockAlertRepository.hasActiveAlert(
      variantId,
      alertType,
    );

    if (hasActiveAlert) {
      throw new StockAlertAlreadyExistsError(variantId, type);
    }

    const alert = StockAlert.create({ variantId, type });

    await this.stockAlertRepository.save(alert);
    return StockAlert.toDTO(alert);
  }

  async resolveStockAlert(alertId: string): Promise<StockAlertDTO> {
    const alert = await this.stockAlertRepository.findById(
      AlertId.fromString(alertId),
    );

    if (!alert) {
      throw new StockAlertNotFoundError(alertId);
    }

    if (alert.isResolved()) {
      throw new InvalidOperationError(`Alert ${alertId} is already resolved`);
    }

    alert.resolve(new Date());
    await this.stockAlertRepository.save(alert);
    return StockAlert.toDTO(alert);
  }

  async deleteStockAlert(alertId: string): Promise<void> {
    const alertIdVO = AlertId.fromString(alertId);
    const alert = await this.stockAlertRepository.findById(alertIdVO);

    if (!alert) {
      throw new StockAlertNotFoundError(alertId);
    }

    await this.stockAlertRepository.delete(alertIdVO);
  }

  async checkAndCreateAlerts(variantId: string): Promise<StockAlertDTO[]> {
    const createdAlerts: StockAlertDTO[] = [];

    const stocks = await this.stockRepository.findByVariant(variantId);

    if (stocks.length === 0) {
      return createdAlerts;
    }

    const totalAvailable = stocks.reduce(
      (sum, stock) => sum + stock.stockLevel.available,
      0,
    );

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

    const hasLowStock = stocks.some((stock) => stock.stockLevel.isLowStock());

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

  async autoResolveAlerts(variantId: string): Promise<StockAlertDTO[]> {
    const resolvedAlerts: StockAlertDTO[] = [];

    const activeAlerts = await this.stockAlertRepository.findActiveAlertsByVariant(variantId);

    if (activeAlerts.length === 0) {
      return resolvedAlerts;
    }

    const totalAvailable = await this.stockRepository.getTotalAvailableStock(variantId);
    const stocks = await this.stockRepository.findByVariant(variantId);
    const hasLowStock = stocks.some((stock) => stock.stockLevel.isLowStock());

    for (const alert of activeAlerts) {
      let shouldResolve = false;

      if (alert.type.getValue() === AlertType.OOS && totalAvailable > 0) {
        shouldResolve = true;
      }

      if (alert.type.getValue() === AlertType.LOW_STOCK && !hasLowStock) {
        shouldResolve = true;
      }

      if (shouldResolve) {
        alert.resolve(new Date());
        await this.stockAlertRepository.save(alert);
        resolvedAlerts.push(StockAlert.toDTO(alert));
      }
    }

    return resolvedAlerts;
  }

  async getStockAlert(alertId: string): Promise<StockAlertDTO> {
    const alert = await this.stockAlertRepository.findById(
      AlertId.fromString(alertId),
    );
    if (!alert) {
      throw new StockAlertNotFoundError(alertId);
    }
    return StockAlert.toDTO(alert);
  }

  async getActiveAlerts(): Promise<StockAlertDTO[]> {
    const alerts = await this.stockAlertRepository.findActiveAlerts();
    return alerts.map(StockAlert.toDTO);
  }

  async getAlertsByVariant(variantId: string): Promise<StockAlertDTO[]> {
    const alerts = await this.stockAlertRepository.findByVariant(variantId);
    return alerts.map(StockAlert.toDTO);
  }

  async listStockAlerts(options?: {
    limit?: number;
    offset?: number;
    includeResolved?: boolean;
  }): Promise<{ alerts: StockAlertDTO[]; total: number }> {
    const result = await this.stockAlertRepository.findAll(options);
    return { alerts: result.items.map(StockAlert.toDTO), total: result.total };
  }
}

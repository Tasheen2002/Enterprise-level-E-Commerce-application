import { StockAlert, StockAlertDTO } from "../../domain/entities/stock-alert.entity";
import { AlertId } from "../../domain/value-objects/alert-id.vo";
import { AlertTypeVO } from "../../domain/value-objects/alert-type.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
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
    // Wrap raw strings in VOs at the service boundary; the repo no longer
    // accepts primitive types.
    const alertType = AlertTypeVO.create(type);
    const variantVo = VariantId.fromString(variantId);

    const hasActiveAlert = await this.stockAlertRepository.hasActiveAlert(
      variantVo,
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
    const variantVo = VariantId.fromString(variantId);

    const stocks = await this.stockRepository.findByVariant(variantVo);

    if (stocks.length === 0) {
      return createdAlerts;
    }

    const totalAvailable = stocks.reduce(
      (sum, stock) => sum + stock.stockLevel.available,
      0,
    );

    if (totalAvailable === 0) {
      const hasActiveAlert = await this.stockAlertRepository.hasActiveAlert(
        variantVo,
        AlertTypeVO.OOS,
      );

      if (!hasActiveAlert) {
        const alert = await this.createStockAlert(variantId, "oos");
        createdAlerts.push(alert);
      }
    }

    const hasLowStock = stocks.some((stock) => stock.stockLevel.isLowStock());

    if (hasLowStock && totalAvailable > 0) {
      const hasActiveAlert = await this.stockAlertRepository.hasActiveAlert(
        variantVo,
        AlertTypeVO.LOW_STOCK,
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
    const variantVo = VariantId.fromString(variantId);

    const activeAlerts = await this.stockAlertRepository.findActiveAlertsByVariant(variantVo);

    if (activeAlerts.length === 0) {
      return resolvedAlerts;
    }

    const totalAvailable = await this.stockRepository.getTotalAvailableStock(variantVo);
    const stocks = await this.stockRepository.findByVariant(variantVo);
    const hasLowStock = stocks.some((stock) => stock.stockLevel.isLowStock());

    for (const alert of activeAlerts) {
      let shouldResolve = false;

      // VO reference equality holds because Pattern D shares static instances —
      // no need to re-import the underlying TS enum just to compare.
      if (alert.type.equals(AlertTypeVO.OOS) && totalAvailable > 0) {
        shouldResolve = true;
      }

      if (alert.type.equals(AlertTypeVO.LOW_STOCK) && !hasLowStock) {
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
    const alerts = await this.stockAlertRepository.findByVariant(
      VariantId.fromString(variantId),
    );
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

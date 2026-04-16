import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { StockAlert } from "../../../domain/entities/stock-alert.entity";
import { AlertId } from "../../../domain/value-objects/alert-id.vo";
import {
  AlertType,
  AlertTypeVO,
} from "../../../domain/value-objects/alert-type.vo";
import { IStockAlertRepository } from "../../../domain/repositories/stock-alert.repository";

interface StockAlertDatabaseRow {
  alertId: string;
  variantId: string;
  type: string;
  triggeredAt: Date;
  resolvedAt: Date | null;
}

export class StockAlertRepositoryImpl extends PrismaRepository<StockAlert> implements IStockAlertRepository {
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: StockAlertDatabaseRow): StockAlert {
    return StockAlert.fromPersistence({
      alertId: AlertId.fromString(row.alertId),
      variantId: row.variantId,
      type: AlertTypeVO.create(row.type),
      triggeredAt: row.triggeredAt,
      resolvedAt: row.resolvedAt || undefined,
    });
  }

  async save(alert: StockAlert): Promise<void> {
    await (this.prisma as any).stockAlert.upsert({
      where: { alertId: alert.alertId.getValue() },
      create: {
        alertId: alert.alertId.getValue(),
        variantId: alert.variantId,
        type: alert.type.getValue(),
        triggeredAt: alert.triggeredAt,
        resolvedAt: alert.resolvedAt,
      },
      update: {
        type: alert.type.getValue(),
        triggeredAt: alert.triggeredAt,
        resolvedAt: alert.resolvedAt,
      },
    });

    await this.dispatchEvents(alert);
  }

  async findById(alertId: AlertId): Promise<StockAlert | null> {
    const alert = await (this.prisma as any).stockAlert.findUnique({
      where: { alertId: alertId.getValue() },
    });

    if (!alert) {
      return null;
    }

    return this.toEntity(alert as StockAlertDatabaseRow);
  }

  async delete(alertId: AlertId): Promise<void> {
    await (this.prisma as any).stockAlert.delete({
      where: { alertId: alertId.getValue() },
    });
  }

  async findByVariant(variantId: string): Promise<StockAlert[]> {
    const alerts = await (this.prisma as any).stockAlert.findMany({
      where: { variantId },
      orderBy: { triggeredAt: "desc" },
    });

    return alerts.map((alert: StockAlertDatabaseRow) => this.toEntity(alert));
  }

  async findActiveAlerts(): Promise<StockAlert[]> {
    const alerts = await (this.prisma as any).stockAlert.findMany({
      where: { resolvedAt: null },
      orderBy: { triggeredAt: "desc" },
    });

    return alerts.map((alert: StockAlertDatabaseRow) => this.toEntity(alert));
  }

  async findResolvedAlerts(): Promise<StockAlert[]> {
    const alerts = await (this.prisma as any).stockAlert.findMany({
      where: { resolvedAt: { not: null } },
      orderBy: { resolvedAt: "desc" },
    });

    return alerts.map((alert: StockAlertDatabaseRow) => this.toEntity(alert));
  }

  async findByType(type: AlertType): Promise<StockAlert[]> {
    const alerts = await (this.prisma as any).stockAlert.findMany({
      where: { type },
      orderBy: { triggeredAt: "desc" },
    });

    return alerts.map((alert: StockAlertDatabaseRow) => this.toEntity(alert));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    includeResolved?: boolean;
  }): Promise<{ alerts: StockAlert[]; total: number }> {
    const { limit = 50, offset = 0, includeResolved = false } = options || {};

    const whereClause = includeResolved ? {} : { resolvedAt: null };

    const [alerts, total] = await Promise.all([
      (this.prisma as any).stockAlert.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { triggeredAt: "desc" },
      }),
      (this.prisma as any).stockAlert.count({ where: whereClause }),
    ]);

    return {
      alerts: alerts.map((alert: StockAlertDatabaseRow) =>
        this.toEntity(alert),
      ),
      total,
    };
  }

  async findActiveAlertsByVariant(variantId: string): Promise<StockAlert[]> {
    const alerts = await (this.prisma as any).stockAlert.findMany({
      where: {
        variantId,
        resolvedAt: null,
      },
      orderBy: { triggeredAt: "desc" },
    });

    return alerts.map((alert: StockAlertDatabaseRow) => this.toEntity(alert));
  }

  async hasActiveAlert(variantId: string, type: AlertType): Promise<boolean> {
    const count = await (this.prisma as any).stockAlert.count({
      where: {
        variantId,
        type,
        resolvedAt: null,
      },
    });

    return count > 0;
  }
}

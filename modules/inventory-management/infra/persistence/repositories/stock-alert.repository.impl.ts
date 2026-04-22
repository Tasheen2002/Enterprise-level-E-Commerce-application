import { PrismaClient, StockAlertTypeEnum } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { StockAlert } from "../../../domain/entities/stock-alert.entity";
import { AlertId } from "../../../domain/value-objects/alert-id.vo";
import {
  AlertType,
  AlertTypeVO,
} from "../../../domain/value-objects/alert-type.vo";
import { IStockAlertRepository } from "../../../domain/repositories/stock-alert.repository";

export class StockAlertRepositoryImpl
  extends PrismaRepository<StockAlert>
  implements IStockAlertRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: {
    alertId: string;
    variantId: string;
    type: string;
    triggeredAt: Date;
    resolvedAt: Date | null;
  }): StockAlert {
    return StockAlert.fromPersistence({
      alertId: AlertId.fromString(row.alertId),
      variantId: row.variantId,
      type: AlertTypeVO.create(row.type),
      triggeredAt: row.triggeredAt,
      resolvedAt: row.resolvedAt ?? undefined,
      createdAt: row.triggeredAt,
      updatedAt: row.resolvedAt ?? row.triggeredAt,
    });
  }

  async save(alert: StockAlert): Promise<void> {
    await this.prisma.stockAlert.upsert({
      where: { alertId: alert.alertId.getValue() },
      create: {
        alertId: alert.alertId.getValue(),
        variantId: alert.variantId,
        type: alert.type.getValue() as StockAlertTypeEnum,
        triggeredAt: alert.triggeredAt,
        resolvedAt: alert.resolvedAt,
      },
      update: {
        type: alert.type.getValue() as StockAlertTypeEnum,
        triggeredAt: alert.triggeredAt,
        resolvedAt: alert.resolvedAt,
      },
    });

    await this.dispatchEvents(alert);
  }

  async findById(alertId: AlertId): Promise<StockAlert | null> {
    const row = await this.prisma.stockAlert.findUnique({
      where: { alertId: alertId.getValue() },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(alertId: AlertId): Promise<void> {
    await this.prisma.stockAlert.delete({
      where: { alertId: alertId.getValue() },
    });
  }

  async findByVariant(variantId: string): Promise<StockAlert[]> {
    const rows = await this.prisma.stockAlert.findMany({
      where: { variantId },
      orderBy: { triggeredAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findActiveAlerts(): Promise<StockAlert[]> {
    const rows = await this.prisma.stockAlert.findMany({
      where: { resolvedAt: null },
      orderBy: { triggeredAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findResolvedAlerts(): Promise<StockAlert[]> {
    const rows = await this.prisma.stockAlert.findMany({
      where: { resolvedAt: { not: null } },
      orderBy: { resolvedAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByType(type: AlertType): Promise<StockAlert[]> {
    const rows = await this.prisma.stockAlert.findMany({
      where: { type: type as StockAlertTypeEnum },
      orderBy: { triggeredAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    includeResolved?: boolean;
  }): Promise<PaginatedResult<StockAlert>> {
    const { limit = 50, offset = 0, includeResolved = false } = options || {};

    const where = includeResolved ? {} : { resolvedAt: null };

    const [rows, total] = await Promise.all([
      this.prisma.stockAlert.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { triggeredAt: "desc" },
      }),
      this.prisma.stockAlert.count({ where }),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async findActiveAlertsByVariant(variantId: string): Promise<StockAlert[]> {
    const rows = await this.prisma.stockAlert.findMany({
      where: { variantId, resolvedAt: null },
      orderBy: { triggeredAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async hasActiveAlert(variantId: string, type: AlertType): Promise<boolean> {
    const count = await this.prisma.stockAlert.count({
      where: { variantId, type: type as StockAlertTypeEnum, resolvedAt: null },
    });

    return count > 0;
  }
}

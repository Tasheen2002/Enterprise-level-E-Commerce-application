import { PrismaClient } from "@prisma/client";
import {
  IOrderStatusHistoryRepository,
  StatusHistoryQueryOptions,
} from "../../../domain/repositories/order-status-history.repository";
import { OrderStatusHistory } from "../../../domain/entities/order-status-history.entity";
import { OrderStatus } from "../../../domain/value-objects/order-status.vo";

interface OrderStatusHistoryDatabaseRow {
  id: bigint;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: Date;
  changedBy: string | null;
}

export class OrderStatusHistoryRepositoryImpl implements IOrderStatusHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: OrderStatusHistoryDatabaseRow): OrderStatusHistory {
    return OrderStatusHistory.fromPersistence({
      historyId: Number(row.id),
      orderId: row.orderId,
      fromStatus: row.fromStatus
        ? OrderStatus.fromString(row.fromStatus)
        : undefined,
      toStatus: OrderStatus.fromString(row.toStatus),
      changedBy: row.changedBy ?? undefined,
      createdAt: row.changedAt,
      updatedAt: row.changedAt,
    });
  }

  async save(statusHistory: OrderStatusHistory): Promise<void> {
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: statusHistory.orderId,
        fromStatus: (statusHistory.fromStatus?.getValue() ?? null) as any,
        toStatus: statusHistory.toStatus.getValue() as any,
        changedBy: statusHistory.changedBy ?? null,
      },
    });
  }

  async delete(historyId: number | null): Promise<void> {
    if (historyId === null) return;
    await this.prisma.orderStatusHistory.delete({
      where: { id: BigInt(historyId) },
    });
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderStatusHistory.deleteMany({
      where: { orderId },
    });
  }

  async findById(historyId: number | null): Promise<OrderStatusHistory | null> {
    if (historyId === null) return null;
    const history = await this.prisma.orderStatusHistory.findUnique({
      where: { id: BigInt(historyId) },
    });

    if (!history) {
      return null;
    }

    return this.toEntity(history as any);
  }

  async findByOrderId(
    orderId: string,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]> {
    const { limit, offset, sortOrder = "desc" } = options || {};

    const histories = await this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      take: limit,
      skip: offset,
      orderBy: { changedAt: sortOrder },
    });

    return histories.map((history) => this.toEntity(history as any));
  }

  async findByStatus(
    status: OrderStatus,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]> {
    const { limit, offset, sortOrder = "desc" } = options || {};

    const histories = await this.prisma.orderStatusHistory.findMany({
      where: { toStatus: status.getValue() as any },
      take: limit,
      skip: offset,
      orderBy: { changedAt: sortOrder },
    });

    return histories.map((history) => this.toEntity(history as any));
  }

  async findByChangedBy(
    changedBy: string,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]> {
    const { limit, offset, sortOrder = "desc" } = options || {};

    const histories = await this.prisma.orderStatusHistory.findMany({
      where: { changedBy },
      take: limit,
      skip: offset,
      orderBy: { changedAt: sortOrder },
    });

    return histories.map((history) => this.toEntity(history as any));
  }

  async countByOrderId(orderId: string): Promise<number> {
    return await this.prisma.orderStatusHistory.count({
      where: { orderId },
    });
  }

  async getLatestByOrderId(
    orderId: string,
  ): Promise<OrderStatusHistory | null> {
    const history = await this.prisma.orderStatusHistory.findFirst({
      where: { orderId },
      orderBy: { changedAt: "desc" },
    });

    if (!history) {
      return null;
    }

    return this.toEntity(history as any);
  }

  async exists(historyId: number | null): Promise<boolean> {
    if (historyId === null) return false;
    const count = await this.prisma.orderStatusHistory.count({
      where: { id: BigInt(historyId) },
    });

    return count > 0;
  }
}

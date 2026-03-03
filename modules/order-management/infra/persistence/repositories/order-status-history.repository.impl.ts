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

  // Hydration: Database row → Entity
  private toEntity(row: OrderStatusHistoryDatabaseRow): OrderStatusHistory {
    return OrderStatusHistory.reconstitute({
      historyId: Number(row.id),
      orderId: row.orderId,
      fromStatus: row.fromStatus
        ? OrderStatus.fromString(row.fromStatus)
        : undefined,
      toStatus: OrderStatus.fromString(row.toStatus),
      changedAt: row.changedAt,
      changedBy: row.changedBy || undefined,
    });
  }

  async save(statusHistory: OrderStatusHistory): Promise<OrderStatusHistory> {
    const created = await this.prisma.orderStatusHistory.create({
      data: {
        orderId: statusHistory.getOrderId(),
        fromStatus: (statusHistory.getFromStatus()?.getValue() || null) as any,
        toStatus: statusHistory.getToStatus().getValue() as any,
        changedAt: statusHistory.getChangedAt(),
        changedBy: statusHistory.getChangedBy() || null,
      },
    });

    // Return the entity with the actual database ID
    return this.toEntity(created as any);
  }

  async delete(historyId: number): Promise<void> {
    await this.prisma.orderStatusHistory.delete({
      where: { id: BigInt(historyId) },
    });
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderStatusHistory.deleteMany({
      where: { orderId },
    });
  }

  async findById(historyId: number): Promise<OrderStatusHistory | null> {
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
      where: { toStatus: status.getValue() as any }, // Prisma enum type cast
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

  async exists(historyId: number): Promise<boolean> {
    const count = await this.prisma.orderStatusHistory.count({
      where: { id: BigInt(historyId) },
    });

    return count > 0;
  }
}

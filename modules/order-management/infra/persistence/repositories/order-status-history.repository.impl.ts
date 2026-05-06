import { PrismaClient, Prisma, OrderStatusEnum } from "@prisma/client";
import {
  IOrderStatusHistoryRepository,
  StatusHistoryQueryOptions,
} from "../../../domain/repositories/order-status-history.repository";
import { OrderStatusHistory } from "../../../domain/entities/order-status-history.entity";
import { OrderStatus } from "../../../domain/value-objects/order-status.vo";
import { OrderId } from "../../../domain/value-objects/order-id.vo";

type OrderStatusHistoryRow = Prisma.OrderStatusHistoryGetPayload<Record<string, never>>;

export class OrderStatusHistoryRepositoryImpl implements IOrderStatusHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: OrderStatusHistoryRow): OrderStatusHistory {
    return OrderStatusHistory.fromPersistence({
      historyId: Number(row.id),
      orderId: row.orderId,
      fromStatus: row.fromStatus
        ? OrderStatus.fromString(row.fromStatus)
        : undefined,
      toStatus: OrderStatus.fromString(row.toStatus),
      changedBy: row.changedBy ?? undefined,
      changedAt: row.changedAt,
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async save(statusHistory: OrderStatusHistory): Promise<void> {
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: statusHistory.orderId,
        fromStatus: (statusHistory.fromStatus?.getValue() ?? null) as OrderStatusEnum | null,
        toStatus: statusHistory.toStatus.getValue() as OrderStatusEnum,
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

  async deleteByOrderId(orderId: OrderId): Promise<void> {
    await this.prisma.orderStatusHistory.deleteMany({
      where: { orderId: orderId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findById(historyId: number | null): Promise<OrderStatusHistory | null> {
    if (historyId === null) return null;
    const row = await this.prisma.orderStatusHistory.findUnique({
      where: { id: BigInt(historyId) },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrderId(
    orderId: OrderId,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]> {
    return this.findMany({ orderId: orderId.getValue() }, options);
  }

  async findByStatus(
    status: OrderStatus,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]> {
    return this.findMany(
      { toStatus: status.getValue() as OrderStatusEnum },
      options,
    );
  }

  async findByChangedBy(
    changedBy: string,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]> {
    return this.findMany({ changedBy }, options);
  }

  async getLatestByOrderId(
    orderId: OrderId,
  ): Promise<OrderStatusHistory | null> {
    const row = await this.prisma.orderStatusHistory.findFirst({
      where: { orderId: orderId.getValue() },
      orderBy: { changedAt: "desc" },
    });
    return row ? this.toEntity(row) : null;
  }

  // ─── Counts / existence ───────────────────────────────────────────────────

  async countByOrderId(orderId: OrderId): Promise<number> {
    return this.prisma.orderStatusHistory.count({
      where: { orderId: orderId.getValue() },
    });
  }

  async exists(historyId: number | null): Promise<boolean> {
    if (historyId === null) return false;
    const count = await this.prisma.orderStatusHistory.count({
      where: { id: BigInt(historyId) },
    });
    return count > 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  // Schema only has `changedAt` as a sortable timestamp — sortBy in the
  // options interface is effectively decorative until other sort dimensions
  // exist. Keeping this hardcoded keeps a single source of truth.
  private async findMany(
    where: Prisma.OrderStatusHistoryWhereInput,
    options: StatusHistoryQueryOptions | undefined,
  ): Promise<OrderStatusHistory[]> {
    const { limit, offset, sortOrder = "desc" } = options || {};

    const rows = await this.prisma.orderStatusHistory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { changedAt: sortOrder },
    });

    return rows.map((r) => this.toEntity(r));
  }
}

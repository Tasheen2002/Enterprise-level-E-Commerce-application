import { PrismaClient, Prisma } from "@prisma/client";
import {
  IOrderEventRepository,
  OrderEventQueryOptions,
} from "../../../domain/repositories/order-event.repository";
import { OrderEvent } from "../../../domain/entities/order-event.entity";
import { OrderId } from "../../../domain/value-objects/order-id.vo";

type OrderEventRow = Prisma.OrderEventGetPayload<Record<string, never>>;

// Domain sortBy → Prisma column name. The entity exposes `eventId`; the DB
// column is `id`. `createdAt` maps 1:1.
const SORT_FIELD_MAP: Record<
  NonNullable<OrderEventQueryOptions["sortBy"]>,
  "id" | "createdAt"
> = {
  eventId: "id",
  createdAt: "createdAt",
};

export class OrderEventRepositoryImpl implements IOrderEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: OrderEventRow): OrderEvent {
    return OrderEvent.fromPersistence({
      eventId: Number(row.id),
      orderId: row.orderId,
      eventType: row.eventType,
      payload: (row.payload ?? {}) as Record<string, unknown>,
      loggedBy: row.loggedBy ?? undefined,
      createdAt: row.createdAt,
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async save(orderEvent: OrderEvent): Promise<void> {
    await this.prisma.orderEvent.create({
      data: {
        orderId: orderEvent.orderId,
        eventType: orderEvent.eventType,
        payload: orderEvent.payload as Prisma.InputJsonValue,
        loggedBy: orderEvent.loggedBy ?? null,
        createdAt: orderEvent.createdAt,
      },
    });
  }

  async delete(eventId: number | null): Promise<void> {
    if (eventId === null) return;
    await this.prisma.orderEvent.delete({
      where: { id: BigInt(eventId) },
    });
  }

  async deleteByOrderId(orderId: OrderId): Promise<void> {
    await this.prisma.orderEvent.deleteMany({
      where: { orderId: orderId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findById(eventId: number | null): Promise<OrderEvent | null> {
    if (eventId === null) return null;
    const row = await this.prisma.orderEvent.findUnique({
      where: { id: BigInt(eventId) },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByOrderId(
    orderId: OrderId,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    return this.findMany({ orderId: orderId.getValue() }, options);
  }

  async findByEventType(
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    return this.findMany({ eventType }, options);
  }

  async findByOrderIdAndEventType(
    orderId: OrderId,
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    return this.findMany({ orderId: orderId.getValue(), eventType }, options);
  }

  async findAll(options?: OrderEventQueryOptions): Promise<OrderEvent[]> {
    return this.findMany({}, options);
  }

  async getLatestByOrderId(orderId: OrderId): Promise<OrderEvent | null> {
    const row = await this.prisma.orderEvent.findFirst({
      where: { orderId: orderId.getValue() },
      orderBy: { createdAt: "desc" },
    });
    return row ? this.toEntity(row) : null;
  }

  // ─── Counts / existence ───────────────────────────────────────────────────

  async countByOrderId(orderId: OrderId): Promise<number> {
    return this.prisma.orderEvent.count({ where: { orderId: orderId.getValue() } });
  }

  async countByEventType(eventType: string): Promise<number> {
    return this.prisma.orderEvent.count({ where: { eventType } });
  }

  async exists(eventId: number | null): Promise<boolean> {
    if (eventId === null) return false;
    const count = await this.prisma.orderEvent.count({
      where: { id: BigInt(eventId) },
    });
    return count > 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findMany(
    where: Prisma.OrderEventWhereInput,
    options: OrderEventQueryOptions | undefined,
  ): Promise<OrderEvent[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const rows = await this.prisma.orderEvent.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [SORT_FIELD_MAP[sortBy]]: sortOrder },
    });

    return rows.map((r) => this.toEntity(r));
  }
}

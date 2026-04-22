import { PrismaClient, Prisma } from "@prisma/client";
import {
  IOrderEventRepository,
  OrderEventQueryOptions,
} from "../../../domain/repositories/order-event.repository";
import { OrderEvent } from "../../../domain/entities/order-event.entity";

type OrderEventRow = Prisma.OrderEventGetPayload<Record<string, never>>;

export class OrderEventRepositoryImpl implements IOrderEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: OrderEventRow): OrderEvent {
    return OrderEvent.fromPersistence({
      eventId: Number(row.id),
      orderId: row.orderId,
      eventType: row.eventType,
      payload: (row.payload ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    });
  }

  async save(orderEvent: OrderEvent): Promise<void> {
    await this.prisma.orderEvent.create({
      data: {
        orderId: orderEvent.orderId,
        eventType: orderEvent.eventType,
        payload: orderEvent.payload as Prisma.InputJsonValue,
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

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderEvent.deleteMany({
      where: { orderId },
    });
  }

  async findById(eventId: number | null): Promise<OrderEvent | null> {
    if (eventId === null) return null;
    const event = await this.prisma.orderEvent.findUnique({
      where: { id: BigInt(eventId) },
    });

    if (!event) {
      return null;
    }

    return this.toEntity(event);
  }

  async findByOrderId(
    orderId: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orderByField = sortBy === "eventId" ? "id" : "createdAt";

    const events = await this.prisma.orderEvent.findMany({
      where: { orderId },
      take: limit,
      skip: offset,
      orderBy: { [orderByField]: sortOrder },
    });

    return events.map((event) => this.toEntity(event));
  }

  async findByEventType(
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orderByField = sortBy === "eventId" ? "id" : "createdAt";

    const events = await this.prisma.orderEvent.findMany({
      where: { eventType },
      take: limit,
      skip: offset,
      orderBy: { [orderByField]: sortOrder },
    });

    return events.map((event) => this.toEntity(event));
  }

  async findByOrderIdAndEventType(
    orderId: string,
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orderByField = sortBy === "eventId" ? "id" : "createdAt";

    const events = await this.prisma.orderEvent.findMany({
      where: {
        orderId,
        eventType,
      },
      take: limit,
      skip: offset,
      orderBy: { [orderByField]: sortOrder },
    });

    return events.map((event) => this.toEntity(event));
  }

  async findAll(options?: OrderEventQueryOptions): Promise<OrderEvent[]> {
    const {
      limit,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const orderByField = sortBy === "eventId" ? "id" : "createdAt";

    const events = await this.prisma.orderEvent.findMany({
      take: limit,
      skip: offset,
      orderBy: { [orderByField]: sortOrder },
    });

    return events.map((event) => this.toEntity(event));
  }

  async countByOrderId(orderId: string): Promise<number> {
    return await this.prisma.orderEvent.count({
      where: { orderId },
    });
  }

  async countByEventType(eventType: string): Promise<number> {
    return await this.prisma.orderEvent.count({
      where: { eventType },
    });
  }

  async getLatestByOrderId(orderId: string): Promise<OrderEvent | null> {
    const event = await this.prisma.orderEvent.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    if (!event) {
      return null;
    }

    return this.toEntity(event);
  }

  async exists(eventId: number | null): Promise<boolean> {
    if (eventId === null) return false;
    const count = await this.prisma.orderEvent.count({
      where: { id: BigInt(eventId) },
    });

    return count > 0;
  }
}

import { OrderEvent } from "../entities/order-event.entity";
import { OrderId } from "../value-objects/order-id.vo";

export interface OrderEventQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "eventId";
  sortOrder?: "asc" | "desc";
}

export interface IOrderEventRepository {
  // Basic CRUD
  save(orderEvent: OrderEvent): Promise<void>;
  delete(eventId: number | null): Promise<void>;
  deleteByOrderId(orderId: OrderId): Promise<void>;

  // Finders
  findById(eventId: number | null): Promise<OrderEvent | null>;
  findByOrderId(
    orderId: OrderId,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]>;
  findByEventType(
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]>;
  findByOrderIdAndEventType(
    orderId: OrderId,
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]>;
  findAll(options?: OrderEventQueryOptions): Promise<OrderEvent[]>;

  // Queries
  countByOrderId(orderId: OrderId): Promise<number>;
  countByEventType(eventType: string): Promise<number>;
  getLatestByOrderId(orderId: OrderId): Promise<OrderEvent | null>;

  // Existence checks
  exists(eventId: number | null): Promise<boolean>;
}

import { OrderEvent } from "../entities/order-event.entity";

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
  deleteByOrderId(orderId: string): Promise<void>;

  // Finders
  findById(eventId: number | null): Promise<OrderEvent | null>;
  findByOrderId(
    orderId: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]>;
  findByEventType(
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]>;
  findByOrderIdAndEventType(
    orderId: string,
    eventType: string,
    options?: OrderEventQueryOptions,
  ): Promise<OrderEvent[]>;
  findAll(options?: OrderEventQueryOptions): Promise<OrderEvent[]>;

  // Queries
  countByOrderId(orderId: string): Promise<number>;
  countByEventType(eventType: string): Promise<number>;
  getLatestByOrderId(orderId: string): Promise<OrderEvent | null>;

  // Existence checks
  exists(eventId: number | null): Promise<boolean>;
}

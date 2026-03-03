import { OrderStatusHistory } from "../entities/order-status-history.entity";
import { OrderStatus } from "../value-objects/order-status.vo";

export interface StatusHistoryQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "changedAt";
  sortOrder?: "asc" | "desc";
}

export interface IOrderStatusHistoryRepository {
  // Basic CRUD
  save(statusHistory: OrderStatusHistory): Promise<OrderStatusHistory>;
  delete(historyId: number): Promise<void>;
  deleteByOrderId(orderId: string): Promise<void>;

  // Finders
  findById(historyId: number): Promise<OrderStatusHistory | null>;
  findByOrderId(
    orderId: string,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]>;
  findByStatus(
    status: OrderStatus,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]>;
  findByChangedBy(
    changedBy: string,
    options?: StatusHistoryQueryOptions,
  ): Promise<OrderStatusHistory[]>;

  // Queries
  countByOrderId(orderId: string): Promise<number>;
  getLatestByOrderId(orderId: string): Promise<OrderStatusHistory | null>;

  // Existence checks
  exists(historyId: number): Promise<boolean>;
}

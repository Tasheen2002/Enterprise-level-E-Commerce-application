import { OrderStatusHistory } from "../entities/order-status-history.entity";
import { OrderStatus } from "../value-objects/order-status.vo";

export interface StatusHistoryQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface IOrderStatusHistoryRepository {
  // Basic CRUD
  save(statusHistory: OrderStatusHistory): Promise<void>;
  delete(historyId: number | null): Promise<void>;
  deleteByOrderId(orderId: string): Promise<void>;

  // Finders
  findById(historyId: number | null): Promise<OrderStatusHistory | null>;
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
  exists(historyId: number | null): Promise<boolean>;
}

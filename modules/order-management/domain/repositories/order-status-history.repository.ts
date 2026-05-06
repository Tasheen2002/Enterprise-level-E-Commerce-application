import { OrderStatusHistory } from "../entities/order-status-history.entity";
import { OrderStatus } from "../value-objects/order-status.vo";
import { OrderId } from "../value-objects/order-id.vo";

export interface StatusHistoryQueryOptions {
  limit?: number;
  offset?: number;
  // Schema only has `changedAt`. (No createdAt/updatedAt — see entity.)
  sortBy?: "changedAt";
  sortOrder?: "asc" | "desc";
}

export interface IOrderStatusHistoryRepository {
  // Basic CRUD
  save(statusHistory: OrderStatusHistory): Promise<void>;
  delete(historyId: number | null): Promise<void>;
  deleteByOrderId(orderId: OrderId): Promise<void>;

  // Finders
  findById(historyId: number | null): Promise<OrderStatusHistory | null>;
  findByOrderId(
    orderId: OrderId,
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
  countByOrderId(orderId: OrderId): Promise<number>;
  getLatestByOrderId(orderId: OrderId): Promise<OrderStatusHistory | null>;

  // Existence checks
  exists(historyId: number | null): Promise<boolean>;
}

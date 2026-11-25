import { Order } from "../entities/order.entity";
import { OrderStatusHistory } from "../entities/order-status-history.entity";
import { OrderId } from "../value-objects/order-id.vo";
import { OrderNumber } from "../value-objects/order-number.vo";
import { OrderStatus } from "../value-objects/order-status.vo";

export interface OrderQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "orderNumber";
  sortOrder?: "asc" | "desc";
}

export interface OrderFilterOptions {
  userId?: string;
  guestToken?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface IOrderRepository {
  // Basic CRUD
  save(order: Order): Promise<void>;
  // Atomically save the order aggregate AND its initial status-history audit
  // entry in the same DB transaction. Used by `createOrder` so a failure
  // between persisting the order and persisting its first audit row can't
  // leave a CREATED-but-no-history orphan.
  saveWithStatusHistory(
    order: Order,
    statusHistory: OrderStatusHistory,
  ): Promise<void>;
  // Deletes the order only while it is still 'created' and nothing else
  // references it (payments, gift card/loyalty/BNPL transactions, returns,
  // shipments, pickup reservations, support history). The check and delete
  // run in one transaction with the order row locked. Returns the blocking
  // reasons; an empty list means the order was deleted.
  deleteIfUnprocessed(orderId: OrderId): Promise<string[]>;

  // Finders
  findById(orderId: OrderId): Promise<Order | null>;
  findByOrderNumber(orderNumber: OrderNumber): Promise<Order | null>;
  findByUserId(userId: string, options?: OrderQueryOptions): Promise<Order[]>;
  findByGuestToken(
    guestToken: string,
    options?: OrderQueryOptions,
  ): Promise<Order[]>;
  findByStatus(
    status: OrderStatus,
    options?: OrderQueryOptions,
  ): Promise<Order[]>;
  findAll(options?: OrderQueryOptions): Promise<Order[]>;

  // Advanced queries
  findWithFilters(
    filters: OrderFilterOptions,
    options?: OrderQueryOptions,
  ): Promise<Order[]>;
  countByStatus(status: OrderStatus): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  count(filters?: OrderFilterOptions): Promise<number>;

  // Existence checks
  exists(orderId: OrderId): Promise<boolean>;
  existsByOrderNumber(orderNumber: OrderNumber): Promise<boolean>;
  getDashboardMetrics(): Promise<unknown>;
}

import { OrderItem } from "../entities/order-item.entity";
import { OrderId } from "../value-objects/order-id.vo";
import { OrderItemId } from "../value-objects/order-item-id.vo";

export interface OrderItemQueryOptions {
  limit?: number;
  offset?: number;
  // "id" yields stable insertion-ordered results (no createdAt column on this table).
  sortBy?: "id" | "quantity" | "price";
  sortOrder?: "asc" | "desc";
}

export interface IOrderItemRepository {
  // Basic CRUD
  save(orderItem: OrderItem): Promise<void>;
  saveAll(orderItems: OrderItem[]): Promise<void>;
  delete(orderItemId: OrderItemId): Promise<void>;
  deleteByOrderId(orderId: OrderId): Promise<void>;

  // Finders
  findById(orderItemId: OrderItemId): Promise<OrderItem | null>;
  findByOrderId(
    orderId: OrderId,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]>;
  findByVariantId(
    variantId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]>;
  findGiftItems(orderId: OrderId): Promise<OrderItem[]>;

  // Queries
  countByOrderId(orderId: OrderId): Promise<number>;
  countByVariantId(variantId: string): Promise<number>;
  getTotalQuantityByVariantId(variantId: string): Promise<number>;

  // Existence checks
  exists(orderItemId: OrderItemId): Promise<boolean>;
  existsByOrderIdAndVariantId(
    orderId: OrderId,
    variantId: string,
  ): Promise<boolean>;
}

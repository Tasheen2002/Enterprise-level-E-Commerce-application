import { OrderItem } from "../entities/order-item.entity";

export interface OrderItemQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "quantity" | "price";
  sortOrder?: "asc" | "desc";
}

export interface IOrderItemRepository {
  // Basic CRUD
  save(orderItem: OrderItem): Promise<void>;
  saveAll(orderItems: OrderItem[]): Promise<void>;
  delete(orderItemId: string): Promise<void>;
  deleteByOrderId(orderId: string): Promise<void>;

  // Finders
  findById(orderItemId: string): Promise<OrderItem | null>;
  findByOrderId(
    orderId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]>;
  findByVariantId(
    variantId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]>;
  findGiftItems(orderId: string): Promise<OrderItem[]>;

  // Queries
  countByOrderId(orderId: string): Promise<number>;
  countByVariantId(variantId: string): Promise<number>;
  getTotalQuantityByVariantId(variantId: string): Promise<number>;

  // Existence checks
  exists(orderItemId: string): Promise<boolean>;
  existsByOrderIdAndVariantId(
    orderId: string,
    variantId: string,
  ): Promise<boolean>;
}

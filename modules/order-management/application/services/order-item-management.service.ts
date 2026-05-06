import {
  IOrderItemRepository,
  OrderItemQueryOptions,
} from "../../domain/repositories/order-item.repository";
import { OrderItem, OrderItemDTO } from "../../domain/entities/order-item.entity";
import {
  ProductSnapshot,
  ProductSnapshotData,
} from "../../domain/value-objects/product-snapshot.vo";
import { OrderItemNotFoundError } from "../../domain/errors/order-management.errors";
import { OrderId } from "../../domain/value-objects/order-id.vo";
import { OrderItemId } from "../../domain/value-objects/order-item-id.vo";

interface CreateOrderItemParams {
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: ProductSnapshotData;
  isGift?: boolean;
  giftMessage?: string;
}

export class OrderItemManagementService {
  constructor(private readonly orderItemRepository: IOrderItemRepository) {}

  async addOrderItem(params: CreateOrderItemParams): Promise<OrderItemDTO> {
    const orderItem = this.buildOrderItem(params);
    await this.orderItemRepository.save(orderItem);
    return OrderItem.toDTO(orderItem);
  }

  // All-or-nothing batch insert — a failure on any item aborts the whole call.
  async addMultipleOrderItems(
    items: CreateOrderItemParams[],
  ): Promise<OrderItemDTO[]> {
    const orderItems = items.map((p) => this.buildOrderItem(p));
    await this.orderItemRepository.saveAll(orderItems);
    return orderItems.map((item) => OrderItem.toDTO(item));
  }

  async getOrderItemById(id: string): Promise<OrderItemDTO | null> {
    const orderItem = await this.orderItemRepository.findById(
      OrderItemId.fromString(id),
    );
    return orderItem ? OrderItem.toDTO(orderItem) : null;
  }

  async getOrderItemsByOrderId(
    orderId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItemDTO[]> {
    const items = await this.orderItemRepository.findByOrderId(
      OrderId.fromString(orderId),
      options,
    );
    return items.map((i) => OrderItem.toDTO(i));
  }

  async getOrderItemsByVariantId(
    variantId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItemDTO[]> {
    const items = await this.orderItemRepository.findByVariantId(variantId, options);
    return items.map((i) => OrderItem.toDTO(i));
  }

  async getGiftItemsByOrderId(orderId: string): Promise<OrderItemDTO[]> {
    const items = await this.orderItemRepository.findGiftItems(
      OrderId.fromString(orderId),
    );
    return items.map((i) => OrderItem.toDTO(i));
  }

  async updateOrderItemQuantity(
    id: string,
    newQuantity: number,
  ): Promise<OrderItemDTO> {
    const orderItem = await this.requireOrderItem(id);
    orderItem.updateQuantity(newQuantity);
    await this.orderItemRepository.save(orderItem);
    return OrderItem.toDTO(orderItem);
  }

  async setOrderItemAsGift(
    id: string,
    giftMessage?: string,
  ): Promise<OrderItemDTO> {
    const orderItem = await this.requireOrderItem(id);
    orderItem.setAsGift(giftMessage);
    await this.orderItemRepository.save(orderItem);
    return OrderItem.toDTO(orderItem);
  }

  async removeGiftFromOrderItem(id: string): Promise<OrderItemDTO> {
    const orderItem = await this.requireOrderItem(id);
    orderItem.removeGift();
    await this.orderItemRepository.save(orderItem);
    return OrderItem.toDTO(orderItem);
  }

  async deleteOrderItem(id: string): Promise<void> {
    const itemId = OrderItemId.fromString(id);
    const exists = await this.orderItemRepository.exists(itemId);
    if (!exists) throw new OrderItemNotFoundError(itemId.getValue());

    await this.orderItemRepository.delete(itemId);
  }

  async deleteAllOrderItemsByOrderId(orderId: string): Promise<void> {
    await this.orderItemRepository.deleteByOrderId(
      OrderId.fromString(orderId),
    );
  }

  async getOrderItemCount(orderId: string): Promise<number> {
    return this.orderItemRepository.countByOrderId(
      OrderId.fromString(orderId),
    );
  }

  async getVariantOrderCount(variantId: string): Promise<number> {
    return this.orderItemRepository.countByVariantId(variantId);
  }

  async getTotalQuantityByVariant(variantId: string): Promise<number> {
    return this.orderItemRepository.getTotalQuantityByVariantId(variantId);
  }

  async orderItemExists(id: string): Promise<boolean> {
    return this.orderItemRepository.exists(OrderItemId.fromString(id));
  }

  async variantExistsInOrder(
    orderId: string,
    variantId: string,
  ): Promise<boolean> {
    return this.orderItemRepository.existsByOrderIdAndVariantId(
      OrderId.fromString(orderId),
      variantId,
    );
  }

  async calculateOrderItemSubtotal(id: string): Promise<number> {
    const orderItem = await this.requireOrderItem(id);
    return orderItem.calculateSubtotal();
  }

  // Sums the per-item subtotals (price × quantity) across the order. NOT the
  // full order total — tax, shipping, and discount are tracked on the Order
  // aggregate's `totals` (OrderTotals VO).
  async calculateItemsSubtotal(orderId: string): Promise<number> {
    const orderItems = await this.orderItemRepository.findByOrderId(
      OrderId.fromString(orderId),
    );
    return orderItems.reduce((sum, item) => sum + item.calculateSubtotal(), 0);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildOrderItem(params: CreateOrderItemParams): OrderItem {
    return OrderItem.create({
      orderId: params.orderId,
      variantId: params.variantId,
      quantity: params.quantity,
      productSnapshot: ProductSnapshot.create(params.productSnapshot),
      isGift: params.isGift ?? false,
      giftMessage: params.giftMessage,
    });
  }

  private async requireOrderItem(id: string): Promise<OrderItem> {
    const itemId = OrderItemId.fromString(id);
    const orderItem = await this.orderItemRepository.findById(itemId);
    if (!orderItem) throw new OrderItemNotFoundError(itemId.getValue());
    return orderItem;
  }
}

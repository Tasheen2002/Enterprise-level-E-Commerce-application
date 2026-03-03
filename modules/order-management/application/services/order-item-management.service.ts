import {
  IOrderItemRepository,
  OrderItemQueryOptions,
} from "../../domain/repositories/order-item.repository";
import { OrderItem } from "../../domain/entities/order-item.entity";
import {
  ProductSnapshot,
  ProductSnapshotData,
} from "../../domain/value-objects/product-snapshot.vo";

export interface CreateOrderItemData {
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: ProductSnapshotData;
  isGift?: boolean;
  giftMessage?: string;
}

export class OrderItemManagementService {
  constructor(private readonly orderItemRepository: IOrderItemRepository) {}

  async addOrderItem(data: CreateOrderItemData): Promise<OrderItem> {
    // Validate required fields
    if (!data.orderId || data.orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!data.variantId || data.variantId.trim().length === 0) {
      throw new Error("Variant ID is required");
    }

    if (data.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // Create product snapshot value object
    const productSnapshot = ProductSnapshot.create(data.productSnapshot);

    // Create the order item entity
    const orderItem = OrderItem.create({
      orderId: data.orderId,
      variantId: data.variantId,
      quantity: data.quantity,
      productSnapshot,
      isGift: data.isGift || false,
      giftMessage: data.giftMessage,
    });

    // Save the order item
    await this.orderItemRepository.save(orderItem);

    return orderItem;
  }

  async addMultipleOrderItems(
    items: CreateOrderItemData[],
  ): Promise<OrderItem[]> {
    if (!items || items.length === 0) {
      throw new Error("At least one order item is required");
    }

    const orderItems: OrderItem[] = [];

    for (const itemData of items) {
      // Validate each item
      if (!itemData.orderId || itemData.orderId.trim().length === 0) {
        throw new Error("Order ID is required for all items");
      }

      if (!itemData.variantId || itemData.variantId.trim().length === 0) {
        throw new Error("Variant ID is required for all items");
      }

      if (itemData.quantity <= 0) {
        throw new Error("Quantity must be greater than 0 for all items");
      }

      const productSnapshot = ProductSnapshot.create(itemData.productSnapshot);

      const orderItem = OrderItem.create({
        orderId: itemData.orderId,
        variantId: itemData.variantId,
        quantity: itemData.quantity,
        productSnapshot,
        isGift: itemData.isGift || false,
        giftMessage: itemData.giftMessage,
      });

      orderItems.push(orderItem);
    }

    // Save all items at once
    await this.orderItemRepository.saveAll(orderItems);

    return orderItems;
  }

  async getOrderItemById(id: string): Promise<OrderItem | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    return await this.orderItemRepository.findById(id);
  }

  async getOrderItemsByOrderId(
    orderId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderItemRepository.findByOrderId(orderId, options);
  }

  async getOrderItemsByVariantId(
    variantId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    if (!variantId || variantId.trim().length === 0) {
      throw new Error("Variant ID is required");
    }

    return await this.orderItemRepository.findByVariantId(variantId, options);
  }

  async getGiftItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderItemRepository.findGiftItems(orderId);
  }

  async updateOrderItemQuantity(
    id: string,
    newQuantity: number,
  ): Promise<OrderItem | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    if (newQuantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const orderItem = await this.getOrderItemById(id);
    if (!orderItem) {
      return null;
    }

    orderItem.updateQuantity(newQuantity);

    await this.orderItemRepository.update(orderItem);

    return orderItem;
  }

  async setOrderItemAsGift(
    id: string,
    giftMessage?: string,
  ): Promise<OrderItem | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const orderItem = await this.getOrderItemById(id);
    if (!orderItem) {
      return null;
    }

    orderItem.setAsGift(giftMessage);

    await this.orderItemRepository.update(orderItem);

    return orderItem;
  }

  async removeGiftFromOrderItem(id: string): Promise<OrderItem | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const orderItem = await this.getOrderItemById(id);
    if (!orderItem) {
      return null;
    }

    orderItem.removeGift();

    await this.orderItemRepository.update(orderItem);

    return orderItem;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const orderItem = await this.getOrderItemById(id);
    if (!orderItem) {
      return false;
    }

    await this.orderItemRepository.delete(id);
    return true;
  }

  async deleteAllOrderItemsByOrderId(orderId: string): Promise<void> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    await this.orderItemRepository.deleteByOrderId(orderId);
  }

  async getOrderItemCount(orderId: string): Promise<number> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    return await this.orderItemRepository.countByOrderId(orderId);
  }

  async getVariantOrderCount(variantId: string): Promise<number> {
    if (!variantId || variantId.trim().length === 0) {
      throw new Error("Variant ID is required");
    }

    return await this.orderItemRepository.countByVariantId(variantId);
  }

  async getTotalQuantityByVariant(variantId: string): Promise<number> {
    if (!variantId || variantId.trim().length === 0) {
      throw new Error("Variant ID is required");
    }

    return await this.orderItemRepository.getTotalQuantityByVariantId(
      variantId,
    );
  }

  async orderItemExists(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    return await this.orderItemRepository.exists(id);
  }

  async variantExistsInOrder(
    orderId: string,
    variantId: string,
  ): Promise<boolean> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    if (!variantId || variantId.trim().length === 0) {
      throw new Error("Variant ID is required");
    }

    return await this.orderItemRepository.existsByOrderIdAndVariantId(
      orderId,
      variantId,
    );
  }

  async calculateOrderItemSubtotal(id: string): Promise<number | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const orderItem = await this.getOrderItemById(id);
    if (!orderItem) {
      return null;
    }

    return orderItem.calculateSubtotal();
  }

  async calculateOrderTotal(orderId: string): Promise<number> {
    if (!orderId || orderId.trim().length === 0) {
      throw new Error("Order ID is required");
    }

    const orderItems = await this.getOrderItemsByOrderId(orderId);

    return orderItems.reduce((total, item) => {
      return total + item.calculateSubtotal();
    }, 0);
  }
}

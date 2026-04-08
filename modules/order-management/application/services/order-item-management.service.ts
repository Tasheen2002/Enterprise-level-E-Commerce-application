import {
  IOrderItemRepository,
  OrderItemQueryOptions,
} from "../../domain/repositories/order-item.repository";
import { OrderItem } from "../../domain/entities/order-item.entity";
import {
  ProductSnapshot,
  ProductSnapshotData,
} from "../../domain/value-objects/product-snapshot.vo";
import { OrderItemNotFoundError } from "../../domain/errors/order-management.errors";

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
    const productSnapshot = ProductSnapshot.create(data.productSnapshot);

    const orderItem = OrderItem.create({
      orderId: data.orderId,
      variantId: data.variantId,
      quantity: data.quantity,
      productSnapshot,
      isGift: data.isGift || false,
      giftMessage: data.giftMessage,
    });

    await this.orderItemRepository.save(orderItem);

    return orderItem;
  }

  async addMultipleOrderItems(
    items: CreateOrderItemData[],
  ): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (const itemData of items) {
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

    await this.orderItemRepository.saveAll(orderItems);

    return orderItems;
  }

  async getOrderItemById(id: string): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findById(id);

    if (!orderItem) {
      throw new OrderItemNotFoundError(id);
    }

    return orderItem;
  }

  async getOrderItemsByOrderId(
    orderId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    return await this.orderItemRepository.findByOrderId(orderId, options);
  }

  async getOrderItemsByVariantId(
    variantId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItem[]> {
    return await this.orderItemRepository.findByVariantId(variantId, options);
  }

  async getGiftItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return await this.orderItemRepository.findGiftItems(orderId);
  }

  async updateOrderItemQuantity(
    id: string,
    newQuantity: number,
  ): Promise<OrderItem> {
    const orderItem = await this.getOrderItemById(id);

    orderItem.updateQuantity(newQuantity);

    await this.orderItemRepository.update(orderItem);

    return orderItem;
  }

  async setOrderItemAsGift(
    id: string,
    giftMessage?: string,
  ): Promise<OrderItem> {
    const orderItem = await this.getOrderItemById(id);

    orderItem.setAsGift(giftMessage);

    await this.orderItemRepository.update(orderItem);

    return orderItem;
  }

  async removeGiftFromOrderItem(id: string): Promise<OrderItem> {
    const orderItem = await this.getOrderItemById(id);

    orderItem.removeGift();

    await this.orderItemRepository.update(orderItem);

    return orderItem;
  }

  async deleteOrderItem(id: string): Promise<void> {
    const orderItem = await this.getOrderItemById(id);

    await this.orderItemRepository.delete(id);
  }

  async deleteAllOrderItemsByOrderId(orderId: string): Promise<void> {
    await this.orderItemRepository.deleteByOrderId(orderId);
  }

  async getOrderItemCount(orderId: string): Promise<number> {
    return await this.orderItemRepository.countByOrderId(orderId);
  }

  async getVariantOrderCount(variantId: string): Promise<number> {
    return await this.orderItemRepository.countByVariantId(variantId);
  }

  async getTotalQuantityByVariant(variantId: string): Promise<number> {
    return await this.orderItemRepository.getTotalQuantityByVariantId(
      variantId,
    );
  }

  async orderItemExists(id: string): Promise<boolean> {
    return await this.orderItemRepository.exists(id);
  }

  async variantExistsInOrder(
    orderId: string,
    variantId: string,
  ): Promise<boolean> {
    return await this.orderItemRepository.existsByOrderIdAndVariantId(
      orderId,
      variantId,
    );
  }

  async calculateOrderItemSubtotal(id: string): Promise<number> {
    const orderItem = await this.getOrderItemById(id);

    return orderItem.calculateSubtotal();
  }

  async calculateOrderTotal(orderId: string): Promise<number> {
    const orderItems = await this.getOrderItemsByOrderId(orderId);

    return orderItems.reduce((total, item) => {
      return total + item.calculateSubtotal();
    }, 0);
  }
}

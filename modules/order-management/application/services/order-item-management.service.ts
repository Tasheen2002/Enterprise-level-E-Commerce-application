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
    const productSnapshot = ProductSnapshot.create(params.productSnapshot);

    const orderItem = OrderItem.create({
      orderId: params.orderId,
      variantId: params.variantId,
      quantity: params.quantity,
      productSnapshot,
      isGift: params.isGift || false,
      giftMessage: params.giftMessage,
    });

    await this.orderItemRepository.save(orderItem);

    return OrderItem.toDTO(orderItem);
  }

  async addMultipleOrderItems(
    items: CreateOrderItemParams[],
  ): Promise<OrderItemDTO[]> {
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

    return orderItems.map((item) => OrderItem.toDTO(item));
  }

  async getOrderItemById(id: string): Promise<OrderItemDTO | null> {
    const orderItem = await this.orderItemRepository.findById(id);
    return orderItem ? OrderItem.toDTO(orderItem) : null;
  }

  async getOrderItemsByOrderId(
    orderId: string,
    options?: OrderItemQueryOptions,
  ): Promise<OrderItemDTO[]> {
    const items = await this.orderItemRepository.findByOrderId(orderId, options);
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
    const items = await this.orderItemRepository.findGiftItems(orderId);
    return items.map((i) => OrderItem.toDTO(i));
  }

  async updateOrderItemQuantity(
    id: string,
    newQuantity: number,
  ): Promise<OrderItemDTO> {
    const orderItem = await this.orderItemRepository.findById(id);
    if (!orderItem) throw new OrderItemNotFoundError(id);

    orderItem.updateQuantity(newQuantity);
    await this.orderItemRepository.save(orderItem);

    return OrderItem.toDTO(orderItem);
  }

  async setOrderItemAsGift(
    id: string,
    giftMessage?: string,
  ): Promise<OrderItemDTO> {
    const orderItem = await this.orderItemRepository.findById(id);
    if (!orderItem) throw new OrderItemNotFoundError(id);

    orderItem.setAsGift(giftMessage);
    await this.orderItemRepository.save(orderItem);

    return OrderItem.toDTO(orderItem);
  }

  async removeGiftFromOrderItem(id: string): Promise<OrderItemDTO> {
    const orderItem = await this.orderItemRepository.findById(id);
    if (!orderItem) throw new OrderItemNotFoundError(id);

    orderItem.removeGift();
    await this.orderItemRepository.save(orderItem);

    return OrderItem.toDTO(orderItem);
  }

  async deleteOrderItem(id: string): Promise<void> {
    const exists = await this.orderItemRepository.exists(id);
    if (!exists) throw new OrderItemNotFoundError(id);

    await this.orderItemRepository.delete(id);
  }

  async deleteAllOrderItemsByOrderId(orderId: string): Promise<void> {
    await this.orderItemRepository.deleteByOrderId(orderId);
  }

  async getOrderItemCount(orderId: string): Promise<number> {
    return this.orderItemRepository.countByOrderId(orderId);
  }

  async getVariantOrderCount(variantId: string): Promise<number> {
    return this.orderItemRepository.countByVariantId(variantId);
  }

  async getTotalQuantityByVariant(variantId: string): Promise<number> {
    return this.orderItemRepository.getTotalQuantityByVariantId(variantId);
  }

  async orderItemExists(id: string): Promise<boolean> {
    return this.orderItemRepository.exists(id);
  }

  async variantExistsInOrder(
    orderId: string,
    variantId: string,
  ): Promise<boolean> {
    return this.orderItemRepository.existsByOrderIdAndVariantId(
      orderId,
      variantId,
    );
  }

  async calculateOrderItemSubtotal(id: string): Promise<number> {
    const orderItem = await this.orderItemRepository.findById(id);
    if (!orderItem) throw new OrderItemNotFoundError(id);

    return orderItem.calculateSubtotal();
  }

  async calculateOrderTotal(orderId: string): Promise<number> {
    const orderItems = await this.orderItemRepository.findByOrderId(orderId);

    return orderItems.reduce((total, item) => {
      return total + item.calculateSubtotal();
    }, 0);
  }
}

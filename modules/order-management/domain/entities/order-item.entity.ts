import { randomUUID } from "crypto";
import { ProductSnapshot } from "../value-objects";

export interface OrderItemProps {
  orderItemId: string;
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: ProductSnapshot;
  isGift: boolean;
  giftMessage?: string;
}

export class OrderItem {
  private orderItemId: string;
  private orderId: string;
  private variantId: string;
  private quantity: number;
  private productSnapshot: ProductSnapshot;
  private isGift: boolean;
  private giftMessage?: string;

  private constructor(props: OrderItemProps) {
    this.orderItemId = props.orderItemId;
    this.orderId = props.orderId;
    this.variantId = props.variantId;
    this.quantity = props.quantity;
    this.productSnapshot = props.productSnapshot;
    this.isGift = props.isGift;
    this.giftMessage = props.giftMessage;
  }

  static create(props: Omit<OrderItemProps, "orderItemId">): OrderItem {
    if (props.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (props.isGift && props.giftMessage && props.giftMessage.length > 500) {
      throw new Error("Gift message cannot exceed 500 characters");
    }

    return new OrderItem({
      orderItemId: randomUUID(),
      orderId: props.orderId,
      variantId: props.variantId,
      quantity: props.quantity,
      productSnapshot: props.productSnapshot,
      isGift: props.isGift,
      giftMessage: props.giftMessage,
    });
  }

  static reconstitute(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  getOrderItemId(): string {
    return this.orderItemId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getVariantId(): string {
    return this.variantId;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getProductSnapshot(): ProductSnapshot {
    return this.productSnapshot;
  }

  isGiftItem(): boolean {
    return this.isGift;
  }

  getGiftMessage(): string | undefined {
    return this.giftMessage;
  }

  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    this.quantity = newQuantity;
  }

  setAsGift(giftMessage?: string): void {
    if (giftMessage && giftMessage.length > 500) {
      throw new Error("Gift message cannot exceed 500 characters");
    }

    this.isGift = true;
    this.giftMessage = giftMessage;
  }

  removeGift(): void {
    this.isGift = false;
    this.giftMessage = undefined;
  }

  calculateSubtotal(): number {
    return this.productSnapshot.getPrice() * this.quantity;
  }

  equals(other: OrderItem): boolean {
    return this.orderItemId === other.orderItemId;
  }

  toSnapshot(): OrderItemProps {
    return {
      orderItemId: this.orderItemId,
      orderId: this.orderId,
      variantId: this.variantId,
      quantity: this.quantity,
      productSnapshot: this.productSnapshot,
      isGift: this.isGift,
      giftMessage: this.giftMessage,
    };
  }
}

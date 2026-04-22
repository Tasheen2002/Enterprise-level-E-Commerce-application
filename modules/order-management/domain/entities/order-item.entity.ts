import { randomUUID } from "crypto";
import { ProductSnapshot, ProductSnapshotData } from "../value-objects";
import { DomainValidationError } from "../errors/order-management.errors";


export interface OrderItemProps {
  orderItemId: string;
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: ProductSnapshot;
  isGift: boolean;
  giftMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemDTO {
  orderItemId: string;
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: ProductSnapshotData;
  isGift: boolean;
  giftMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export class OrderItem {
  private constructor(private props: OrderItemProps) {}

  static create(
    params: Omit<OrderItemProps, "orderItemId" | "createdAt" | "updatedAt">,
  ): OrderItem {
    if (params.quantity <= 0) {
      throw new DomainValidationError("Quantity must be greater than 0");
    }

    if (
      params.isGift &&
      params.giftMessage &&
      params.giftMessage.length > 500
    ) {
      throw new DomainValidationError(
        "Gift message cannot exceed 500 characters",
      );
    }

    return new OrderItem({
      ...params,
      orderItemId: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  get orderItemId(): string {
    return this.props.orderItemId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get productSnapshot(): ProductSnapshot {
    return this.props.productSnapshot;
  }

  get isGift(): boolean {
    return this.props.isGift;
  }

  get giftMessage(): string | undefined {
    return this.props.giftMessage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isGiftItem(): boolean {
    return this.props.isGift;
  }

  setOrderId(orderId: string): void {
    this.props.orderId = orderId;
    this.props.updatedAt = new Date();
  }

  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new DomainValidationError("Quantity must be greater than 0");
    }

    this.props.quantity = newQuantity;
    this.props.updatedAt = new Date();
  }

  setAsGift(giftMessage?: string): void {
    if (giftMessage && giftMessage.length > 500) {
      throw new DomainValidationError(
        "Gift message cannot exceed 500 characters",
      );
    }

    this.props.isGift = true;
    this.props.giftMessage = giftMessage;
    this.props.updatedAt = new Date();
  }

  removeGift(): void {
    this.props.isGift = false;
    this.props.giftMessage = undefined;
    this.props.updatedAt = new Date();
  }

  calculateSubtotal(): number {
    return this.props.productSnapshot.price * this.props.quantity;
  }

  equals(other: OrderItem): boolean {
    return this.props.orderItemId === other.props.orderItemId;
  }

  static toDTO(entity: OrderItem): OrderItemDTO {
    return {
      orderItemId: entity.props.orderItemId,
      orderId: entity.props.orderId,
      variantId: entity.props.variantId,
      quantity: entity.props.quantity,
      productSnapshot: entity.props.productSnapshot.getValue(),
      isGift: entity.props.isGift,
      giftMessage: entity.props.giftMessage,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

import { OrderItemId, ProductSnapshot, ProductSnapshotData } from "../value-objects";
import { DomainValidationError } from "../errors/order-management.errors";
import { ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH } from "../constants/order-management.constants";

export interface OrderItemProps {
  orderItemId: OrderItemId;
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: ProductSnapshot;
  isGift: boolean;
  giftMessage?: string;
}

export interface OrderItemDTO {
  orderItemId: string;
  orderId: string;
  variantId: string;
  quantity: number;
  productSnapshot: ProductSnapshotData;
  isGift: boolean;
  giftMessage?: string;
}

export class OrderItem {
  private constructor(private props: OrderItemProps) {
    OrderItem.validate(props);
  }

  static create(
    params: Omit<OrderItemProps, "orderItemId">,
  ): OrderItem {
    return new OrderItem({
      ...params,
      orderItemId: OrderItemId.create(),
    });
  }

  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: OrderItemProps): void {
    if (props.quantity <= 0) {
      throw new DomainValidationError("Quantity must be greater than 0");
    }
    if (
      props.isGift &&
      props.giftMessage &&
      props.giftMessage.length > ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH
    ) {
      throw new DomainValidationError(
        `Gift message cannot exceed ${ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH} characters`,
      );
    }
  }

  get orderItemId(): OrderItemId {
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

  setOrderId(orderId: string): void {
    this.props.orderId = orderId;
  }

  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new DomainValidationError("Quantity must be greater than 0");
    }
    this.props.quantity = newQuantity;
  }

  setAsGift(giftMessage?: string): void {
    if (giftMessage && giftMessage.length > ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH) {
      throw new DomainValidationError(
        `Gift message cannot exceed ${ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH} characters`,
      );
    }
    this.props.isGift = true;
    this.props.giftMessage = giftMessage;
  }

  removeGift(): void {
    this.props.isGift = false;
    this.props.giftMessage = undefined;
  }

  calculateSubtotal(): number {
    return this.props.productSnapshot.price * this.props.quantity;
  }

  equals(other: OrderItem): boolean {
    return this.props.orderItemId.equals(other.props.orderItemId);
  }

  static toDTO(entity: OrderItem): OrderItemDTO {
    return {
      orderItemId: entity.props.orderItemId.getValue(),
      orderId: entity.props.orderId,
      variantId: entity.props.variantId,
      quantity: entity.props.quantity,
      productSnapshot: entity.props.productSnapshot.getValue(),
      isGift: entity.props.isGift,
      giftMessage: entity.props.giftMessage,
    };
  }
}

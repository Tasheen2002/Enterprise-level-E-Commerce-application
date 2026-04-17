import { DomainValidationError } from "../errors/order-management.errors";
import { OrderStatusEnum } from "../enums";

export class OrderStatus {
  private readonly value: OrderStatusEnum;

  private constructor(value: OrderStatusEnum) {
    this.value = value;
  }

  static fromString(value: string): OrderStatus {
    const normalizedValue = value.toLowerCase();

    if (
      !Object.values(OrderStatusEnum).includes(
        normalizedValue as OrderStatusEnum,
      )
    ) {
      throw new DomainValidationError(`Invalid order status: ${value}`);
    }

    return new OrderStatus(normalizedValue as OrderStatusEnum);
  }

  static created(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CREATED);
  }

  static pending(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PENDING);
  }

  static confirmed(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CONFIRMED);
  }

  static paid(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PAID);
  }

  static processing(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PROCESSING);
  }

  static shipped(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.SHIPPED);
  }

  static delivered(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.DELIVERED);
  }

  static fulfilled(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.FULFILLED);
  }

  static partiallyReturned(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PARTIALLY_RETURNED);
  }

  static refunded(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.REFUNDED);
  }

  static cancelled(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CANCELLED);
  }

  getValue(): string {
    return this.value;
  }

  isCreated(): boolean {
    return this.value === OrderStatusEnum.CREATED;
  }

  isPending(): boolean {
    return this.value === OrderStatusEnum.PENDING;
  }

  isConfirmed(): boolean {
    return this.value === OrderStatusEnum.CONFIRMED;
  }

  isPaid(): boolean {
    return this.value === OrderStatusEnum.PAID;
  }

  isProcessing(): boolean {
    return this.value === OrderStatusEnum.PROCESSING;
  }

  isShipped(): boolean {
    return this.value === OrderStatusEnum.SHIPPED;
  }

  isDelivered(): boolean {
    return this.value === OrderStatusEnum.DELIVERED;
  }

  isFulfilled(): boolean {
    return this.value === OrderStatusEnum.FULFILLED;
  }

  isPartiallyReturned(): boolean {
    return this.value === OrderStatusEnum.PARTIALLY_RETURNED;
  }

  isRefunded(): boolean {
    return this.value === OrderStatusEnum.REFUNDED;
  }

  isCancelled(): boolean {
    return this.value === OrderStatusEnum.CANCELLED;
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
      [OrderStatusEnum.CREATED]: [
        OrderStatusEnum.PENDING,
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.PAID,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.PENDING]: [
        OrderStatusEnum.CREATED, // Correction
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.PAID,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.CONFIRMED]: [
        OrderStatusEnum.PENDING, // Correction
        OrderStatusEnum.PAID,
        OrderStatusEnum.PROCESSING,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.PAID]: [
        OrderStatusEnum.CONFIRMED, // Correction
        OrderStatusEnum.PROCESSING,
        OrderStatusEnum.SHIPPED,
        OrderStatusEnum.DELIVERED, // Added for testing purposes
        OrderStatusEnum.FULFILLED,
        OrderStatusEnum.REFUNDED,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.PROCESSING]: [
        OrderStatusEnum.PAID, // Correction
        OrderStatusEnum.SHIPPED,
        OrderStatusEnum.FULFILLED,
        OrderStatusEnum.REFUNDED,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.SHIPPED]: [
        OrderStatusEnum.PROCESSING, // Correction
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.PARTIALLY_RETURNED,
        OrderStatusEnum.REFUNDED,
      ],
      [OrderStatusEnum.DELIVERED]: [
        OrderStatusEnum.PARTIALLY_RETURNED,
        OrderStatusEnum.REFUNDED,
      ],
      [OrderStatusEnum.FULFILLED]: [
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.PARTIALLY_RETURNED,
        OrderStatusEnum.REFUNDED,
      ],
      [OrderStatusEnum.PARTIALLY_RETURNED]: [OrderStatusEnum.REFUNDED],
      [OrderStatusEnum.REFUNDED]: [],
      [OrderStatusEnum.CANCELLED]: [
        OrderStatusEnum.CREATED,
        OrderStatusEnum.PENDING,
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.PAID,
        OrderStatusEnum.PROCESSING,
      ],
    };

    return transitions[this.value].includes(newStatus.value);
  }

  equals(other: OrderStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

import { DomainValidationError } from "../errors/order-management.errors";

// The canonical TS enum for order statuses lives in this file (alongside the
// Pattern D VO that wraps it) — not in a separate `enums/` directory.
// Persistence-side enum mapping uses Prisma's generated `OrderStatusEnum`
// from `@prisma/client`, which mirrors these values.
export enum OrderStatusValue {
  /** Cart-converted, not yet acknowledged by customer (transient). */
  CREATED = "created",
  /** Awaiting payment authorization. */
  PENDING = "pending",
  /** Customer confirmed, awaiting payment capture. */
  CONFIRMED = "confirmed",
  /** Payment captured. Ready for fulfillment. */
  PAID = "paid",
  /** Warehouse picking/packing. */
  PROCESSING = "processing",
  /** Handed to carrier; tracking active. */
  SHIPPED = "shipped",
  /** Carrier confirmed delivery. */
  DELIVERED = "delivered",
  /**
   * @deprecated Legacy combined "shipped+delivered" state. Use SHIPPED → DELIVERED instead.
   * Retained for historical orders; new orders should not transition into FULFILLED.
   */
  FULFILLED = "fulfilled",
  /** One or more items returned, others kept. */
  PARTIALLY_RETURNED = "partially_returned",
  /** Full refund issued (terminal). */
  REFUNDED = "refunded",
  /** Order cancelled before fulfillment (terminal). */
  CANCELLED = "cancelled",
}

// Backwards-compatibility alias for code that still imports `OrderStatusEnum`
// from this module. Prefer `OrderStatusValue`.
/** @deprecated Use `OrderStatusValue`. */
export const OrderStatusEnum = OrderStatusValue;
/** @deprecated Use `OrderStatusValue`. */
export type OrderStatusEnum = OrderStatusValue;

// Pattern D (Enum-Like VO):
// Shared static instances per allowed value — `create()` / `fromString()`
// route through the private `ALL` array via `.find()`, returning the
// shared instance so reference equality matches between callers. The
// previous implementation returned a fresh instance on every factory call
// (e.g., `OrderStatus.created()`), which broke `===` checks.
export class OrderStatus {
  static readonly CREATED = new OrderStatus(OrderStatusValue.CREATED);
  static readonly PENDING = new OrderStatus(OrderStatusValue.PENDING);
  static readonly CONFIRMED = new OrderStatus(OrderStatusValue.CONFIRMED);
  static readonly PAID = new OrderStatus(OrderStatusValue.PAID);
  static readonly PROCESSING = new OrderStatus(OrderStatusValue.PROCESSING);
  static readonly SHIPPED = new OrderStatus(OrderStatusValue.SHIPPED);
  static readonly DELIVERED = new OrderStatus(OrderStatusValue.DELIVERED);
  /** @deprecated Use SHIPPED → DELIVERED transitions. */
  static readonly FULFILLED = new OrderStatus(OrderStatusValue.FULFILLED);
  static readonly PARTIALLY_RETURNED = new OrderStatus(OrderStatusValue.PARTIALLY_RETURNED);
  static readonly REFUNDED = new OrderStatus(OrderStatusValue.REFUNDED);
  static readonly CANCELLED = new OrderStatus(OrderStatusValue.CANCELLED);

  private static readonly ALL: ReadonlyArray<OrderStatus> = [
    OrderStatus.CREATED,
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.FULFILLED,
    OrderStatus.PARTIALLY_RETURNED,
    OrderStatus.REFUNDED,
    OrderStatus.CANCELLED,
  ];

  // Validation lives in the constructor so BOTH `create()` (input from a
  // service caller) and `fromString()` (raw, for repository reconstitution)
  // validate. Both factories route through `create()` to get shared-instance
  // reference equality on success.
  private constructor(private readonly value: OrderStatusValue) {
    if (!Object.values(OrderStatusValue).includes(value)) {
      throw new DomainValidationError(`Invalid order status: ${value}`);
    }
  }

  static create(value: string): OrderStatus {
    const normalized = value.trim().toLowerCase();
    return (
      OrderStatus.ALL.find((s) => s.value === normalized) ??
      new OrderStatus(normalized as OrderStatusValue)
    );
  }

  static fromString(value: string): OrderStatus {
    return OrderStatus.create(value);
  }

  // ── Backwards-compatibility factory methods ───────────────────────
  // Legacy code calls `OrderStatus.created()` / `.paid()` / etc. These now
  // return the shared static instance instead of allocating.
  /** @deprecated Use `OrderStatus.CREATED`. */
  static created(): OrderStatus { return OrderStatus.CREATED; }
  /** @deprecated Use `OrderStatus.PENDING`. */
  static pending(): OrderStatus { return OrderStatus.PENDING; }
  /** @deprecated Use `OrderStatus.CONFIRMED`. */
  static confirmed(): OrderStatus { return OrderStatus.CONFIRMED; }
  /** @deprecated Use `OrderStatus.PAID`. */
  static paid(): OrderStatus { return OrderStatus.PAID; }
  /** @deprecated Use `OrderStatus.PROCESSING`. */
  static processing(): OrderStatus { return OrderStatus.PROCESSING; }
  /** @deprecated Use `OrderStatus.SHIPPED`. */
  static shipped(): OrderStatus { return OrderStatus.SHIPPED; }
  /** @deprecated Use `OrderStatus.DELIVERED`. */
  static delivered(): OrderStatus { return OrderStatus.DELIVERED; }
  /** @deprecated Use `OrderStatus.FULFILLED`. */
  static fulfilled(): OrderStatus { return OrderStatus.FULFILLED; }
  /** @deprecated Use `OrderStatus.PARTIALLY_RETURNED`. */
  static partiallyReturned(): OrderStatus { return OrderStatus.PARTIALLY_RETURNED; }
  /** @deprecated Use `OrderStatus.REFUNDED`. */
  static refunded(): OrderStatus { return OrderStatus.REFUNDED; }
  /** @deprecated Use `OrderStatus.CANCELLED`. */
  static cancelled(): OrderStatus { return OrderStatus.CANCELLED; }

  getValue(): OrderStatusValue {
    return this.value;
  }

  isCreated(): boolean { return this.value === OrderStatusValue.CREATED; }
  isPending(): boolean { return this.value === OrderStatusValue.PENDING; }
  isConfirmed(): boolean { return this.value === OrderStatusValue.CONFIRMED; }
  isPaid(): boolean { return this.value === OrderStatusValue.PAID; }
  isProcessing(): boolean { return this.value === OrderStatusValue.PROCESSING; }
  isShipped(): boolean { return this.value === OrderStatusValue.SHIPPED; }
  isDelivered(): boolean { return this.value === OrderStatusValue.DELIVERED; }
  isFulfilled(): boolean { return this.value === OrderStatusValue.FULFILLED; }
  isPartiallyReturned(): boolean { return this.value === OrderStatusValue.PARTIALLY_RETURNED; }
  isRefunded(): boolean { return this.value === OrderStatusValue.REFUNDED; }
  isCancelled(): boolean { return this.value === OrderStatusValue.CANCELLED; }

  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatusValue, OrderStatusValue[]> = {
      [OrderStatusValue.CREATED]: [
        OrderStatusValue.PENDING,
        OrderStatusValue.CONFIRMED,
        OrderStatusValue.PAID,
        OrderStatusValue.CANCELLED,
      ],
      [OrderStatusValue.PENDING]: [
        OrderStatusValue.CREATED,
        OrderStatusValue.CONFIRMED,
        OrderStatusValue.PAID,
        OrderStatusValue.CANCELLED,
      ],
      [OrderStatusValue.CONFIRMED]: [
        OrderStatusValue.PENDING,
        OrderStatusValue.PAID,
        OrderStatusValue.PROCESSING,
        OrderStatusValue.CANCELLED,
      ],
      [OrderStatusValue.PAID]: [
        OrderStatusValue.CONFIRMED,
        OrderStatusValue.PROCESSING,
        OrderStatusValue.SHIPPED,
        OrderStatusValue.FULFILLED,
        OrderStatusValue.REFUNDED,
        OrderStatusValue.CANCELLED,
      ],
      [OrderStatusValue.PROCESSING]: [
        OrderStatusValue.PAID,
        OrderStatusValue.SHIPPED,
        OrderStatusValue.FULFILLED,
        OrderStatusValue.REFUNDED,
        OrderStatusValue.CANCELLED,
      ],
      [OrderStatusValue.SHIPPED]: [
        OrderStatusValue.PROCESSING,
        OrderStatusValue.DELIVERED,
        OrderStatusValue.PARTIALLY_RETURNED,
        OrderStatusValue.REFUNDED,
      ],
      [OrderStatusValue.DELIVERED]: [
        OrderStatusValue.PARTIALLY_RETURNED,
        OrderStatusValue.REFUNDED,
      ],
      [OrderStatusValue.FULFILLED]: [
        OrderStatusValue.DELIVERED,
        OrderStatusValue.PARTIALLY_RETURNED,
        OrderStatusValue.REFUNDED,
      ],
      [OrderStatusValue.PARTIALLY_RETURNED]: [OrderStatusValue.REFUNDED],
      [OrderStatusValue.REFUNDED]: [],
      [OrderStatusValue.CANCELLED]: [],
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

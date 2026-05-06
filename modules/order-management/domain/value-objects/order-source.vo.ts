import { DomainValidationError } from "../errors/order-management.errors";

// The canonical TS enum for order sources lives in this file (alongside the
// Pattern D VO that wraps it) — not in a separate `enums/` directory.
export enum OrderSourceValue {
  WEB = "web",
  MOBILE = "mobile",
}

// Backwards-compatibility alias for code that still imports `OrderSourceEnum`
// from this module. Prefer `OrderSourceValue`.
/** @deprecated Use `OrderSourceValue`. */
export const OrderSourceEnum = OrderSourceValue;
/** @deprecated Use `OrderSourceValue`. */
export type OrderSourceEnum = OrderSourceValue;

// Pattern D (Enum-Like VO):
// Shared static instances per allowed value — `create()` / `fromString()`
// route through the private `ALL` array via `.find()`, returning the
// shared instance so reference equality matches between callers.
export class OrderSource {
  static readonly WEB = new OrderSource(OrderSourceValue.WEB);
  static readonly MOBILE = new OrderSource(OrderSourceValue.MOBILE);

  private static readonly ALL: ReadonlyArray<OrderSource> = [
    OrderSource.WEB,
    OrderSource.MOBILE,
  ];

  private constructor(private readonly value: OrderSourceValue) {
    if (!Object.values(OrderSourceValue).includes(value)) {
      throw new DomainValidationError(`Invalid order source: ${value}`);
    }
  }

  static create(value: string): OrderSource {
    const normalized = value.trim().toLowerCase();
    return (
      OrderSource.ALL.find((s) => s.value === normalized) ??
      new OrderSource(normalized as OrderSourceValue)
    );
  }

  static fromString(value: string): OrderSource {
    return OrderSource.create(value);
  }

  /** @deprecated Use `OrderSource.WEB`. */
  static web(): OrderSource { return OrderSource.WEB; }
  /** @deprecated Use `OrderSource.MOBILE`. */
  static mobile(): OrderSource { return OrderSource.MOBILE; }

  getValue(): OrderSourceValue {
    return this.value;
  }

  isWeb(): boolean { return this.value === OrderSourceValue.WEB; }
  isMobile(): boolean { return this.value === OrderSourceValue.MOBILE; }

  equals(other: OrderSource): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

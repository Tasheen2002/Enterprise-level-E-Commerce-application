export class EventType {
  private static readonly VALID_TYPES = [
    "product_view",
    "purchase",
    "add_to_cart",
    "begin_checkout",
    "add_shipping_info",
    "add_payment_info",
  ] as const;
  private readonly value: (typeof EventType.VALID_TYPES)[number];

  private constructor(value: (typeof EventType.VALID_TYPES)[number]) {
    this.value = value;
  }

  static productView(): EventType {
    return new EventType("product_view");
  }

  static purchase(): EventType {
    return new EventType("purchase");
  }

  static addToCart(): EventType {
    return new EventType("add_to_cart");
  }

  static beginCheckout(): EventType {
    return new EventType("begin_checkout");
  }

  static addShippingInfo(): EventType {
    return new EventType("add_shipping_info");
  }

  static addPaymentInfo(): EventType {
    return new EventType("add_payment_info");
  }

  static create(type: string): EventType {
    if (!EventType.VALID_TYPES.includes(type as any)) {
      throw new Error(
        `Invalid event type: ${type}. Must be one of: ${EventType.VALID_TYPES.join(", ")}`
      );
    }
    return new EventType(type as (typeof EventType.VALID_TYPES)[number]);
  }

  getValue(): string {
    return this.value;
  }

  isProductView(): boolean {
    return this.value === "product_view";
  }

  isPurchase(): boolean {
    return this.value === "purchase";
  }

  isAddToCart(): boolean {
    return this.value === "add_to_cart";
  }

  isBeginCheckout(): boolean {
    return this.value === "begin_checkout";
  }

  isAddShippingInfo(): boolean {
    return this.value === "add_shipping_info";
  }

  isAddPaymentInfo(): boolean {
    return this.value === "add_payment_info";
  }

  equals(other: EventType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

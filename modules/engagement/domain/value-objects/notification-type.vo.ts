export class NotificationType {
  private constructor(private readonly value: string) {}

  static orderConfirm(): NotificationType {
    return new NotificationType("order_confirm");
  }

  static shipped(): NotificationType {
    return new NotificationType("shipped");
  }

  static restock(): NotificationType {
    return new NotificationType("restock");
  }

  static reviewRequest(): NotificationType {
    return new NotificationType("review_request");
  }

  static careGuide(): NotificationType {
    return new NotificationType("care_guide");
  }

  static promo(): NotificationType {
    return new NotificationType("promo");
  }

  static fromString(value: string): NotificationType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "order_confirm":
        return NotificationType.orderConfirm();
      case "shipped":
        return NotificationType.shipped();
      case "restock":
        return NotificationType.restock();
      case "review_request":
        return NotificationType.reviewRequest();
      case "care_guide":
        return NotificationType.careGuide();
      case "promo":
        return NotificationType.promo();
      default:
        throw new Error(`Invalid notification type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isOrderConfirm(): boolean {
    return this.value === "order_confirm";
  }

  isShipped(): boolean {
    return this.value === "shipped";
  }

  isRestock(): boolean {
    return this.value === "restock";
  }

  isReviewRequest(): boolean {
    return this.value === "review_request";
  }

  isCareGuide(): boolean {
    return this.value === "care_guide";
  }

  isPromo(): boolean {
    return this.value === "promo";
  }

  equals(other: NotificationType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

import { DomainValidationError } from "../errors/engagement.errors";

export enum NotificationTypeValue {
  ORDER_CONFIRM = "order_confirm",
  SHIPPED = "shipped",
  RESTOCK = "restock",
  REVIEW_REQUEST = "review_request",
  CARE_GUIDE = "care_guide",
  PROMO = "promo",
}

/** @deprecated Use `NotificationTypeValue`. */
export const NotificationTypeEnum = NotificationTypeValue;
/** @deprecated Use `NotificationTypeValue`. */
export type NotificationTypeEnum = NotificationTypeValue;

// Pattern D (Enum-Like VO).
export class NotificationType {
  static readonly ORDER_CONFIRM = new NotificationType(NotificationTypeValue.ORDER_CONFIRM);
  static readonly SHIPPED = new NotificationType(NotificationTypeValue.SHIPPED);
  static readonly RESTOCK = new NotificationType(NotificationTypeValue.RESTOCK);
  static readonly REVIEW_REQUEST = new NotificationType(NotificationTypeValue.REVIEW_REQUEST);
  static readonly CARE_GUIDE = new NotificationType(NotificationTypeValue.CARE_GUIDE);
  static readonly PROMO = new NotificationType(NotificationTypeValue.PROMO);

  private static readonly ALL: ReadonlyArray<NotificationType> = [
    NotificationType.ORDER_CONFIRM,
    NotificationType.SHIPPED,
    NotificationType.RESTOCK,
    NotificationType.REVIEW_REQUEST,
    NotificationType.CARE_GUIDE,
    NotificationType.PROMO,
  ];

  private constructor(private readonly value: NotificationTypeValue) {
    if (!Object.values(NotificationTypeValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid notification type: ${value}. Must be one of: ${Object.values(NotificationTypeValue).join(", ")}`,
      );
    }
  }

  static create(value: string): NotificationType {
    const normalized = value.trim().toLowerCase();
    return (
      NotificationType.ALL.find((t) => t.value === normalized) ??
      new NotificationType(normalized as NotificationTypeValue)
    );
  }

  static fromString(value: string): NotificationType {
    return NotificationType.create(value);
  }

  /** @deprecated Use `NotificationType.ORDER_CONFIRM`. */
  static orderConfirm(): NotificationType { return NotificationType.ORDER_CONFIRM; }
  /** @deprecated Use `NotificationType.SHIPPED`. */
  static shipped(): NotificationType { return NotificationType.SHIPPED; }
  /** @deprecated Use `NotificationType.RESTOCK`. */
  static restock(): NotificationType { return NotificationType.RESTOCK; }
  /** @deprecated Use `NotificationType.REVIEW_REQUEST`. */
  static reviewRequest(): NotificationType { return NotificationType.REVIEW_REQUEST; }
  /** @deprecated Use `NotificationType.CARE_GUIDE`. */
  static careGuide(): NotificationType { return NotificationType.CARE_GUIDE; }
  /** @deprecated Use `NotificationType.PROMO`. */
  static promo(): NotificationType { return NotificationType.PROMO; }

  getValue(): NotificationTypeValue { return this.value; }

  isOrderConfirm(): boolean { return this.value === NotificationTypeValue.ORDER_CONFIRM; }
  isShipped(): boolean { return this.value === NotificationTypeValue.SHIPPED; }
  isRestock(): boolean { return this.value === NotificationTypeValue.RESTOCK; }
  isReviewRequest(): boolean { return this.value === NotificationTypeValue.REVIEW_REQUEST; }
  isCareGuide(): boolean { return this.value === NotificationTypeValue.CARE_GUIDE; }
  isPromo(): boolean { return this.value === NotificationTypeValue.PROMO; }

  equals(other: NotificationType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}

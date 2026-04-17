import { DomainValidationError } from "../errors/engagement.errors";
import { NotificationTypeEnum } from "../enums/engagement.enums";

export class NotificationType {
  private constructor(private readonly value: NotificationTypeEnum) {}

  static create(value: string): NotificationType {
    return NotificationType.fromString(value);
  }

  static fromString(value: string): NotificationType {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(NotificationTypeEnum).includes(normalized as NotificationTypeEnum)) {
      throw new DomainValidationError(`Invalid notification type: ${value}`);
    }

    return new NotificationType(normalized as NotificationTypeEnum);
  }

  static orderConfirm(): NotificationType {
    return new NotificationType(NotificationTypeEnum.ORDER_CONFIRM);
  }

  static shipped(): NotificationType {
    return new NotificationType(NotificationTypeEnum.SHIPPED);
  }

  static restock(): NotificationType {
    return new NotificationType(NotificationTypeEnum.RESTOCK);
  }

  static reviewRequest(): NotificationType {
    return new NotificationType(NotificationTypeEnum.REVIEW_REQUEST);
  }

  static careGuide(): NotificationType {
    return new NotificationType(NotificationTypeEnum.CARE_GUIDE);
  }

  static promo(): NotificationType {
    return new NotificationType(NotificationTypeEnum.PROMO);
  }

  getValue(): string {
    return this.value;
  }

  isOrderConfirm(): boolean {
    return this.value === NotificationTypeEnum.ORDER_CONFIRM;
  }

  isShipped(): boolean {
    return this.value === NotificationTypeEnum.SHIPPED;
  }

  isRestock(): boolean {
    return this.value === NotificationTypeEnum.RESTOCK;
  }

  isReviewRequest(): boolean {
    return this.value === NotificationTypeEnum.REVIEW_REQUEST;
  }

  isCareGuide(): boolean {
    return this.value === NotificationTypeEnum.CARE_GUIDE;
  }

  isPromo(): boolean {
    return this.value === NotificationTypeEnum.PROMO;
  }

  equals(other: NotificationType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

import { DomainValidationError } from "../errors/engagement.errors";
import { NotificationStatusEnum } from "../enums/engagement.enums";

export class NotificationStatus {
  private constructor(private readonly value: NotificationStatusEnum) {}

  static create(value: string): NotificationStatus {
    return NotificationStatus.fromString(value);
  }

  static fromString(value: string): NotificationStatus {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(NotificationStatusEnum).includes(normalized as NotificationStatusEnum)) {
      throw new DomainValidationError(`Invalid notification status: ${value}`);
    }

    return new NotificationStatus(normalized as NotificationStatusEnum);
  }

  static pending(): NotificationStatus {
    return new NotificationStatus(NotificationStatusEnum.PENDING);
  }

  static scheduled(): NotificationStatus {
    return new NotificationStatus(NotificationStatusEnum.SCHEDULED);
  }

  static sending(): NotificationStatus {
    return new NotificationStatus(NotificationStatusEnum.SENDING);
  }

  static sent(): NotificationStatus {
    return new NotificationStatus(NotificationStatusEnum.SENT);
  }

  static failed(): NotificationStatus {
    return new NotificationStatus(NotificationStatusEnum.FAILED);
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === NotificationStatusEnum.PENDING;
  }

  isScheduled(): boolean {
    return this.value === NotificationStatusEnum.SCHEDULED;
  }

  isSending(): boolean {
    return this.value === NotificationStatusEnum.SENDING;
  }

  isSent(): boolean {
    return this.value === NotificationStatusEnum.SENT;
  }

  isFailed(): boolean {
    return this.value === NotificationStatusEnum.FAILED;
  }

  equals(other: NotificationStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

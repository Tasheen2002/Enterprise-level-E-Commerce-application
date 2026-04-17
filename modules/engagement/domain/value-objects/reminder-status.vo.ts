import { DomainValidationError } from "../errors/engagement.errors";
import { ReminderStatusEnum } from "../enums/engagement.enums";

export class ReminderStatus {
  private constructor(private readonly value: ReminderStatusEnum) {}

  static create(value: string): ReminderStatus {
    return ReminderStatus.fromString(value);
  }

  static fromString(value: string): ReminderStatus {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(ReminderStatusEnum).includes(normalized as ReminderStatusEnum)) {
      throw new DomainValidationError(`Invalid reminder status: ${value}`);
    }

    return new ReminderStatus(normalized as ReminderStatusEnum);
  }

  static pending(): ReminderStatus {
    return new ReminderStatus(ReminderStatusEnum.PENDING);
  }

  static sent(): ReminderStatus {
    return new ReminderStatus(ReminderStatusEnum.SENT);
  }

  static unsubscribed(): ReminderStatus {
    return new ReminderStatus(ReminderStatusEnum.UNSUBSCRIBED);
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === ReminderStatusEnum.PENDING;
  }

  isSent(): boolean {
    return this.value === ReminderStatusEnum.SENT;
  }

  isUnsubscribed(): boolean {
    return this.value === ReminderStatusEnum.UNSUBSCRIBED;
  }

  equals(other: ReminderStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

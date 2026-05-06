import { DomainValidationError } from "../errors/engagement.errors";

export enum NotificationStatusValue {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
}

/** @deprecated Use `NotificationStatusValue`. */
export const NotificationStatusEnum = NotificationStatusValue;
/** @deprecated Use `NotificationStatusValue`. */
export type NotificationStatusEnum = NotificationStatusValue;

// Pattern D (Enum-Like VO).
export class NotificationStatus {
  static readonly PENDING = new NotificationStatus(NotificationStatusValue.PENDING);
  static readonly SCHEDULED = new NotificationStatus(NotificationStatusValue.SCHEDULED);
  static readonly SENDING = new NotificationStatus(NotificationStatusValue.SENDING);
  static readonly SENT = new NotificationStatus(NotificationStatusValue.SENT);
  static readonly FAILED = new NotificationStatus(NotificationStatusValue.FAILED);

  private static readonly ALL: ReadonlyArray<NotificationStatus> = [
    NotificationStatus.PENDING,
    NotificationStatus.SCHEDULED,
    NotificationStatus.SENDING,
    NotificationStatus.SENT,
    NotificationStatus.FAILED,
  ];

  private constructor(private readonly value: NotificationStatusValue) {
    if (!Object.values(NotificationStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid notification status: ${value}. Must be one of: ${Object.values(NotificationStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): NotificationStatus {
    const normalized = value.trim().toLowerCase();
    return (
      NotificationStatus.ALL.find((t) => t.value === normalized) ??
      new NotificationStatus(normalized as NotificationStatusValue)
    );
  }

  static fromString(value: string): NotificationStatus {
    return NotificationStatus.create(value);
  }

  /** @deprecated Use `NotificationStatus.PENDING`. */
  static pending(): NotificationStatus { return NotificationStatus.PENDING; }
  /** @deprecated Use `NotificationStatus.SCHEDULED`. */
  static scheduled(): NotificationStatus { return NotificationStatus.SCHEDULED; }
  /** @deprecated Use `NotificationStatus.SENDING`. */
  static sending(): NotificationStatus { return NotificationStatus.SENDING; }
  /** @deprecated Use `NotificationStatus.SENT`. */
  static sent(): NotificationStatus { return NotificationStatus.SENT; }
  /** @deprecated Use `NotificationStatus.FAILED`. */
  static failed(): NotificationStatus { return NotificationStatus.FAILED; }

  getValue(): NotificationStatusValue { return this.value; }

  isPending(): boolean { return this.value === NotificationStatusValue.PENDING; }
  isScheduled(): boolean { return this.value === NotificationStatusValue.SCHEDULED; }
  isSending(): boolean { return this.value === NotificationStatusValue.SENDING; }
  isSent(): boolean { return this.value === NotificationStatusValue.SENT; }
  isFailed(): boolean { return this.value === NotificationStatusValue.FAILED; }

  equals(other: NotificationStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}

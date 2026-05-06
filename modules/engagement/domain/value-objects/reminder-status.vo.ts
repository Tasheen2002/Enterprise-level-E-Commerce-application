import { DomainValidationError } from "../errors/engagement.errors";

export enum ReminderStatusValue {
  PENDING = "pending",
  SENT = "sent",
  UNSUBSCRIBED = "unsubscribed",
}

/** @deprecated Use `ReminderStatusValue`. */
export const ReminderStatusEnum = ReminderStatusValue;
/** @deprecated Use `ReminderStatusValue`. */
export type ReminderStatusEnum = ReminderStatusValue;

// Pattern D (Enum-Like VO).
export class ReminderStatus {
  static readonly PENDING = new ReminderStatus(ReminderStatusValue.PENDING);
  static readonly SENT = new ReminderStatus(ReminderStatusValue.SENT);
  static readonly UNSUBSCRIBED = new ReminderStatus(ReminderStatusValue.UNSUBSCRIBED);

  private static readonly ALL: ReadonlyArray<ReminderStatus> = [
    ReminderStatus.PENDING,
    ReminderStatus.SENT,
    ReminderStatus.UNSUBSCRIBED,
  ];

  private constructor(private readonly value: ReminderStatusValue) {
    if (!Object.values(ReminderStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid reminder status: ${value}. Must be one of: ${Object.values(ReminderStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): ReminderStatus {
    const normalized = value.trim().toLowerCase();
    return (
      ReminderStatus.ALL.find((t) => t.value === normalized) ??
      new ReminderStatus(normalized as ReminderStatusValue)
    );
  }

  static fromString(value: string): ReminderStatus {
    return ReminderStatus.create(value);
  }

  /** @deprecated Use `ReminderStatus.PENDING`. */
  static pending(): ReminderStatus { return ReminderStatus.PENDING; }
  /** @deprecated Use `ReminderStatus.SENT`. */
  static sent(): ReminderStatus { return ReminderStatus.SENT; }
  /** @deprecated Use `ReminderStatus.UNSUBSCRIBED`. */
  static unsubscribed(): ReminderStatus { return ReminderStatus.UNSUBSCRIBED; }

  getValue(): ReminderStatusValue { return this.value; }

  isPending(): boolean { return this.value === ReminderStatusValue.PENDING; }
  isSent(): boolean { return this.value === ReminderStatusValue.SENT; }
  isUnsubscribed(): boolean { return this.value === ReminderStatusValue.UNSUBSCRIBED; }

  equals(other: ReminderStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}

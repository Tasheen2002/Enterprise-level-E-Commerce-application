import { DomainValidationError } from "../errors/engagement.errors";

export enum SubscriptionStatusValue {
  ACTIVE = "active",
  UNSUBSCRIBED = "unsubscribed",
  BOUNCED = "bounced",
  SPAM = "spam",
}

/** @deprecated Use `SubscriptionStatusValue`. */
export const SubscriptionStatusEnum = SubscriptionStatusValue;
/** @deprecated Use `SubscriptionStatusValue`. */
export type SubscriptionStatusEnum = SubscriptionStatusValue;

// Pattern D (Enum-Like VO).
export class SubscriptionStatus {
  static readonly ACTIVE = new SubscriptionStatus(SubscriptionStatusValue.ACTIVE);
  static readonly UNSUBSCRIBED = new SubscriptionStatus(SubscriptionStatusValue.UNSUBSCRIBED);
  static readonly BOUNCED = new SubscriptionStatus(SubscriptionStatusValue.BOUNCED);
  static readonly SPAM = new SubscriptionStatus(SubscriptionStatusValue.SPAM);

  private static readonly ALL: ReadonlyArray<SubscriptionStatus> = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.UNSUBSCRIBED,
    SubscriptionStatus.BOUNCED,
    SubscriptionStatus.SPAM,
  ];

  private constructor(private readonly value: SubscriptionStatusValue) {
    if (!Object.values(SubscriptionStatusValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid subscription status: ${value}. Must be one of: ${Object.values(SubscriptionStatusValue).join(", ")}`,
      );
    }
  }

  static create(value: string): SubscriptionStatus {
    const normalized = value.trim().toLowerCase();
    return (
      SubscriptionStatus.ALL.find((t) => t.value === normalized) ??
      new SubscriptionStatus(normalized as SubscriptionStatusValue)
    );
  }

  static fromString(value: string): SubscriptionStatus {
    return SubscriptionStatus.create(value);
  }

  /** @deprecated Use `SubscriptionStatus.ACTIVE`. */
  static active(): SubscriptionStatus { return SubscriptionStatus.ACTIVE; }
  /** @deprecated Use `SubscriptionStatus.UNSUBSCRIBED`. */
  static unsubscribed(): SubscriptionStatus { return SubscriptionStatus.UNSUBSCRIBED; }
  /** @deprecated Use `SubscriptionStatus.BOUNCED`. */
  static bounced(): SubscriptionStatus { return SubscriptionStatus.BOUNCED; }
  /** @deprecated Use `SubscriptionStatus.SPAM`. */
  static spam(): SubscriptionStatus { return SubscriptionStatus.SPAM; }

  getValue(): SubscriptionStatusValue { return this.value; }

  isActive(): boolean { return this.value === SubscriptionStatusValue.ACTIVE; }
  isUnsubscribed(): boolean { return this.value === SubscriptionStatusValue.UNSUBSCRIBED; }
  isBounced(): boolean { return this.value === SubscriptionStatusValue.BOUNCED; }
  isSpam(): boolean { return this.value === SubscriptionStatusValue.SPAM; }

  canReceiveEmails(): boolean { return this.value === SubscriptionStatusValue.ACTIVE; }

  equals(other: SubscriptionStatus): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}

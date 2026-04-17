import { DomainValidationError } from "../errors/engagement.errors";
import { SubscriptionStatusEnum } from "../enums/engagement.enums";

export class SubscriptionStatus {
  private constructor(private readonly value: SubscriptionStatusEnum) {}

  static create(value: string): SubscriptionStatus {
    return SubscriptionStatus.fromString(value);
  }

  static fromString(value: string): SubscriptionStatus {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(SubscriptionStatusEnum).includes(normalized as SubscriptionStatusEnum)) {
      throw new DomainValidationError(`Invalid subscription status: ${value}`);
    }

    return new SubscriptionStatus(normalized as SubscriptionStatusEnum);
  }

  static active(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.ACTIVE);
  }

  static unsubscribed(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.UNSUBSCRIBED);
  }

  static bounced(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.BOUNCED);
  }

  static spam(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.SPAM);
  }

  getValue(): string {
    return this.value;
  }

  isActive(): boolean {
    return this.value === SubscriptionStatusEnum.ACTIVE;
  }

  isUnsubscribed(): boolean {
    return this.value === SubscriptionStatusEnum.UNSUBSCRIBED;
  }

  isBounced(): boolean {
    return this.value === SubscriptionStatusEnum.BOUNCED;
  }

  isSpam(): boolean {
    return this.value === SubscriptionStatusEnum.SPAM;
  }

  canReceiveEmails(): boolean {
    return this.value === SubscriptionStatusEnum.ACTIVE;
  }

  equals(other: SubscriptionStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

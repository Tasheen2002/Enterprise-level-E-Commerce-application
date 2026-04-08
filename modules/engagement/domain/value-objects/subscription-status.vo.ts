export class SubscriptionStatus {
  private constructor(private readonly value: string) {}

  static active(): SubscriptionStatus {
    return new SubscriptionStatus("active");
  }

  static unsubscribed(): SubscriptionStatus {
    return new SubscriptionStatus("unsubscribed");
  }

  static bounced(): SubscriptionStatus {
    return new SubscriptionStatus("bounced");
  }

  static spam(): SubscriptionStatus {
    return new SubscriptionStatus("spam");
  }

  static fromString(value: string): SubscriptionStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "active":
        return SubscriptionStatus.active();
      case "unsubscribed":
        return SubscriptionStatus.unsubscribed();
      case "bounced":
        return SubscriptionStatus.bounced();
      case "spam":
        return SubscriptionStatus.spam();
      default:
        throw new Error(`Invalid subscription status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isUnsubscribed(): boolean {
    return this.value === "unsubscribed";
  }

  isBounced(): boolean {
    return this.value === "bounced";
  }

  isSpam(): boolean {
    return this.value === "spam";
  }

  canReceiveEmails(): boolean {
    return this.value === "active";
  }

  equals(other: SubscriptionStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

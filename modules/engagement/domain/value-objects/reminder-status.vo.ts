export class ReminderStatus {
  private constructor(private readonly value: string) {}

  static pending(): ReminderStatus {
    return new ReminderStatus("pending");
  }

  static sent(): ReminderStatus {
    return new ReminderStatus("sent");
  }

  static unsubscribed(): ReminderStatus {
    return new ReminderStatus("unsubscribed");
  }

  static fromString(value: string): ReminderStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "pending":
        return ReminderStatus.pending();
      case "sent":
        return ReminderStatus.sent();
      case "unsubscribed":
        return ReminderStatus.unsubscribed();
      default:
        throw new Error(`Invalid reminder status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  isSent(): boolean {
    return this.value === "sent";
  }

  isUnsubscribed(): boolean {
    return this.value === "unsubscribed";
  }

  equals(other: ReminderStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class NotificationStatus {
  private constructor(private readonly value: string) {}

  static pending(): NotificationStatus {
    return new NotificationStatus("pending");
  }

  static scheduled(): NotificationStatus {
    return new NotificationStatus("scheduled");
  }

  static sending(): NotificationStatus {
    return new NotificationStatus("sending");
  }

  static sent(): NotificationStatus {
    return new NotificationStatus("sent");
  }

  static failed(): NotificationStatus {
    return new NotificationStatus("failed");
  }

  static fromString(value: string): NotificationStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "pending":
        return NotificationStatus.pending();
      case "scheduled":
        return NotificationStatus.scheduled();
      case "sending":
        return NotificationStatus.sending();
      case "sent":
        return NotificationStatus.sent();
      case "failed":
        return NotificationStatus.failed();
      default:
        throw new Error(`Invalid notification status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  isScheduled(): boolean {
    return this.value === "scheduled";
  }

  isSending(): boolean {
    return this.value === "sending";
  }

  isSent(): boolean {
    return this.value === "sent";
  }

  isFailed(): boolean {
    return this.value === "failed";
  }

  equals(other: NotificationStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

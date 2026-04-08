export class MessageSender {
  private constructor(private readonly value: string) {}

  static agent(): MessageSender {
    return new MessageSender("agent");
  }

  static customer(): MessageSender {
    return new MessageSender("customer");
  }

  static fromString(value: string): MessageSender {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "agent":
        return MessageSender.agent();
      case "customer":
        return MessageSender.customer();
      default:
        throw new Error(`Invalid message sender: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isAgent(): boolean {
    return this.value === "agent";
  }

  isCustomer(): boolean {
    return this.value === "customer";
  }

  equals(other: MessageSender): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

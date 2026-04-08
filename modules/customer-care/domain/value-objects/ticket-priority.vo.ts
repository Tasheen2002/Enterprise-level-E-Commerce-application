export class TicketPriority {
  private constructor(private readonly value: string) {}

  static low(): TicketPriority {
    return new TicketPriority("low");
  }

  static medium(): TicketPriority {
    return new TicketPriority("medium");
  }

  static high(): TicketPriority {
    return new TicketPriority("high");
  }

  static urgent(): TicketPriority {
    return new TicketPriority("urgent");
  }

  static fromString(value: string): TicketPriority {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "low":
        return TicketPriority.low();
      case "medium":
        return TicketPriority.medium();
      case "high":
        return TicketPriority.high();
      case "urgent":
        return TicketPriority.urgent();
      default:
        throw new Error(`Invalid ticket priority: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isLow(): boolean {
    return this.value === "low";
  }

  isMedium(): boolean {
    return this.value === "medium";
  }

  isHigh(): boolean {
    return this.value === "high";
  }

  isUrgent(): boolean {
    return this.value === "urgent";
  }

  equals(other: TicketPriority): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

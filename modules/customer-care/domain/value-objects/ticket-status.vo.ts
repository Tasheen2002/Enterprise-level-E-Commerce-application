export class TicketStatus {
  private constructor(private readonly value: string) {}

  static open(): TicketStatus {
    return new TicketStatus("open");
  }

  static inProgress(): TicketStatus {
    return new TicketStatus("in_progress");
  }

  static resolved(): TicketStatus {
    return new TicketStatus("resolved");
  }

  static closed(): TicketStatus {
    return new TicketStatus("closed");
  }

  static fromString(value: string): TicketStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "open":
        return TicketStatus.open();
      case "in_progress":
        return TicketStatus.inProgress();
      case "resolved":
        return TicketStatus.resolved();
      case "closed":
        return TicketStatus.closed();
      default:
        throw new Error(`Invalid ticket status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isOpen(): boolean {
    return this.value === "open";
  }

  isInProgress(): boolean {
    return this.value === "in_progress";
  }

  isResolved(): boolean {
    return this.value === "resolved";
  }

  isClosed(): boolean {
    return this.value === "closed";
  }

  equals(other: TicketStatus): boolean {
    return this.value === other.value;
  }
  toString(): string {
    return this.value;
  }
}

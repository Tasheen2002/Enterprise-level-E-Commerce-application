export class TicketSource {
  private constructor(private readonly value: string) {}

  static email(): TicketSource {
    return new TicketSource("email");
  }

  static chat(): TicketSource {
    return new TicketSource("chat");
  }

  static phone(): TicketSource {
    return new TicketSource("phone");
  }

  static fromString(value: string): TicketSource {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "email":
        return TicketSource.email();
      case "chat":
        return TicketSource.chat();
      case "phone":
        return TicketSource.phone();
      default:
        throw new Error(`Invalid ticket source: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isEmail(): boolean {
    return this.value === "email";
  }

  isChat(): boolean {
    return this.value === "chat";
  }

  isPhone(): boolean {
    return this.value === "phone";
  }

  equals(other: TicketSource): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TicketId {
  private constructor(private readonly value: string) {}

  static generate(): TicketId {
    return new TicketId(randomUUID());
  }

  static create(value: string): TicketId {
    if (!value || value.trim().length === 0) {
      throw new Error("Ticket ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("Ticket ID must be a valid UUID");
    }

    return new TicketId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TicketId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

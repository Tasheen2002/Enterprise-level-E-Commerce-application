import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MessageId {
  private constructor(private readonly value: string) {}

  static generate(): MessageId {
    return new MessageId(randomUUID());
  }

  static create(value: string): MessageId {
    if (!value || value.trim().length === 0) {
      throw new Error("Message ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("Message ID must be a valid UUID");
    }

    return new MessageId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

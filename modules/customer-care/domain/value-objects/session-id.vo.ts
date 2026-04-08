import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SessionId {
  private constructor(private readonly value: string) {}

  static generate(): SessionId {
    return new SessionId(randomUUID());
  }

  static create(value: string): SessionId {
    if (!value || value.trim().length === 0) {
      throw new Error("Session ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("Session ID must be a valid UUID");
    }

    return new SessionId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

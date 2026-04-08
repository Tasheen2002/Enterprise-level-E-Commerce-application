import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class RmaId {
  private constructor(private readonly value: string) {}

  static generate(): RmaId {
    return new RmaId(randomUUID());
  }

  static create(value: string): RmaId {
    if (!value || value.trim().length === 0) {
      throw new Error("RMA ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("RMA ID must be a valid UUID");
    }

    return new RmaId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RmaId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

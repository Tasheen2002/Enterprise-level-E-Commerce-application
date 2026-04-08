import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GoodwillId {
  private constructor(private readonly value: string) {}

  static generate(): GoodwillId {
    return new GoodwillId(randomUUID());
  }

  static create(value: string): GoodwillId {
    if (!value || value.trim().length === 0) {
      throw new Error("Goodwill ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("Goodwill ID must be a valid UUID");
    }

    return new GoodwillId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GoodwillId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

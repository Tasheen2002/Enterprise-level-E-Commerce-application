import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class FeedbackId {
  private constructor(private readonly value: string) {}

  static generate(): FeedbackId {
    return new FeedbackId(randomUUID());
  }

  static create(value: string): FeedbackId {
    if (!value || value.trim().length === 0) {
      throw new Error("Feedback ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("Feedback ID must be a valid UUID");
    }

    return new FeedbackId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: FeedbackId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

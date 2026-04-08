import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class RepairId {
  private constructor(private readonly value: string) {}

  static generate(): RepairId {
    return new RepairId(randomUUID());
  }

  static create(value: string): RepairId {
    if (!value || value.trim().length === 0) {
      throw new Error("Repair ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("Repair ID must be a valid UUID");
    }

    return new RepairId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RepairId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

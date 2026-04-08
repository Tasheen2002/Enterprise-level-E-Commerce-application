// TODO: Implement AgentId value object
import { randomUUID } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AgentId {
  private constructor(private readonly value: string) {}

  static generate(): AgentId {
    return new AgentId(randomUUID());
  }

  static create(value: string): AgentId {
    if (!value || value.trim().length === 0) {
      throw new Error("Agent ID cannot be empty");
    }

    if (!UUID_REGEX.test(value)) {
      throw new Error("Agent ID must be a valid UUID");
    }

    return new AgentId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AgentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

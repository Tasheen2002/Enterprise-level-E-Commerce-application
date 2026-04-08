import { randomUUID } from 'crypto';

export class EventId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): EventId {
    if (!value || value.trim().length === 0) {
      throw new Error('Event ID cannot be empty');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('Event ID must be a valid UUID');
    }

    return new EventId(value);
  }

  static generate(): EventId {
    return new EventId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EventId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

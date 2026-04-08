import { randomUUID } from 'crypto';

export class SessionId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): SessionId {
    if (!value || value.trim().length === 0) {
      throw new Error('Session ID cannot be empty');
    }

    return new SessionId(value);
  }

  static generate(): SessionId {
    return new SessionId(randomUUID());
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

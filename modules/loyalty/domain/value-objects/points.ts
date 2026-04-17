import { InvalidFormatError } from '../../../../packages/core/src/domain/domain-error';

export class Points {
  private constructor(private readonly value: number) {
    if (!Number.isInteger(value)) {
      throw new InvalidFormatError('points', 'integer');
    }
    if (value < 0) {
      throw new InvalidFormatError('points', 'non-negative integer');
    }
  }

  static create(value: number): Points {
    return new Points(value);
  }

  static zero(): Points {
    return new Points(0);
  }

  getValue(): number {
    return this.value;
  }

  add(other: Points): Points {
    return new Points(this.value + other.value);
  }

  subtract(other: Points): Points {
    const result = this.value - other.value;
    if (result < 0) {
      throw new InvalidFormatError('points', 'sufficient balance for subtraction');
    }
    return new Points(result);
  }

  isGreaterThanOrEqual(other: Points): boolean {
    return this.value >= other.value;
  }

  equals(other: Points): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }
}

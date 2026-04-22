import { InvalidFormatError } from '../../../../packages/core/src/domain/domain-error';
import { InsufficientPointsError } from '../errors';

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

  static fromString(value: string): Points {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new InvalidFormatError('points', 'integer string');
    }
    return new Points(parsed);
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
      throw new InsufficientPointsError(other.value, this.value);
    }
    return new Points(result);
  }

  isZero(): boolean {
    return this.value === 0;
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

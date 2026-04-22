import { DomainValidationError } from "../errors/engagement.errors";
import { RATING_MIN, RATING_MAX } from "../constants/engagement.constants";

export class Rating {
  private readonly value: number;

  private constructor(value: number) {
    if (!Number.isInteger(value) || value < RATING_MIN || value > RATING_MAX) {
      throw new DomainValidationError(`Rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`);
    }

    this.value = value;
  }

  static create(value: number): Rating {
    return new Rating(value);
  }

  static fromNumber(value: number): Rating {
    return new Rating(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Rating): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  isPositive(): boolean {
    return this.value >= 4;
  }

  isNegative(): boolean {
    return this.value <= 2;
  }

  isNeutral(): boolean {
    return this.value === 3;
  }

  toStars(): string {
    return "★".repeat(this.value) + "☆".repeat(RATING_MAX - this.value);
  }
}

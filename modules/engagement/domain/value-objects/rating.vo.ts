export class Rating {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new Error("Rating must be an integer");
    }

    if (value < 1 || value > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    this.value = value;
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

  static fromNumber(value: number): Rating {
    return new Rating(value);
  }

  // Helper methods
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
    return "".repeat(this.value) + "".repeat(5 - this.value);
  }
}

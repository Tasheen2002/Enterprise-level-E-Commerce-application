export class Points {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  static create(value: number): Points {
    if (!Number.isInteger(value)) {
      throw new Error('Points must be an integer');
    }
    if (value < 0) {
      throw new Error('Points cannot be negative');
    }
    return new Points(value);
  }

  static zero(): Points {
    return new Points(0);
  }

  get value(): number {
    return this._value;
  }

  add(points: Points): Points {
    return Points.create(this._value + points.value);
  }

  subtract(points: Points): Points {
    const result = this._value - points.value;
    if (result < 0) {
      throw new Error('Insufficient points');
    }
    return Points.create(result);
  }

  isGreaterThanOrEqual(points: Points): boolean {
    return this._value >= points.value;
  }

  equals(points: Points): boolean {
    return this._value === points.value;
  }

  toString(): string {
    return this._value.toString();
  }
}

import { Currency } from "../../../../packages/core/src/domain/value-objects/currency.vo";
import { InvalidPriceError } from "../errors";

export interface MoneyDTO {
  amount: number;
  currency: string;
}

export class Money {
  private static readonly MAX_AMOUNT = 10_000_000;
  private static readonly MIN_AMOUNT = 0;
  private static readonly DECIMAL_PLACES = 2;

  private constructor(
    private readonly amount: number,
    private readonly currency: Currency,
  ) {
    Money.validate(amount);
  }

  static create(amount: number, currency: Currency | string): Money {
    const rounded = Math.round(amount * 100) / 100;
    const cur = typeof currency === "string" ? Currency.create(currency) : currency;
    return new Money(rounded, cur);
  }

  static fromPersistence(amount: number, currency: string): Money {
    return new Money(amount, Currency.fromString(currency));
  }

  static zero(currency: Currency | string): Money {
    const cur = typeof currency === "string" ? Currency.create(currency) : currency;
    return new Money(0, cur);
  }

  private static validate(amount: number): void {
    if (!Number.isFinite(amount)) {
      throw new InvalidPriceError("Amount must be a finite number");
    }
    if (amount < Money.MIN_AMOUNT) {
      throw new InvalidPriceError("Amount cannot be negative");
    }
    if (amount > Money.MAX_AMOUNT) {
      throw new InvalidPriceError(`Amount cannot exceed ${Money.MAX_AMOUNT}`);
    }
    const rounded = Number(amount.toFixed(Money.DECIMAL_PLACES));
    if (Math.abs(rounded - amount) > 0.001) {
      throw new InvalidPriceError(
        `Amount cannot have more than ${Money.DECIMAL_PLACES} decimal places`,
      );
    }
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency.equals(other.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  applyDiscount(percentage: number): Money {
    if (percentage < 0 || percentage > 100) {
      throw new InvalidPriceError(
        "Discount percentage must be between 0 and 100",
      );
    }
    const discountAmount = this.amount * (percentage / 100);
    return Money.create(this.amount - discountAmount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  toDTO(): MoneyDTO {
    return { amount: this.amount, currency: this.currency.getValue() };
  }

  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency.getValue()}`;
  }

  private assertSameCurrency(other: Money): void {
    if (!this.currency.equals(other.currency)) {
      throw new InvalidPriceError(
        `Currency mismatch: ${this.currency.getValue()} vs ${other.currency.getValue()}`,
      );
    }
  }
}

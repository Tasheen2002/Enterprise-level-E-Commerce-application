import { DomainValidationError } from "../errors";
import { Currency } from "./currency.vo";

export class Money {
  private constructor(
    private readonly cents: number,
    private readonly currency: Currency,
  ) {}

  static create(amountOrCents: number, currency: Currency | string): Money {
    if (typeof amountOrCents !== "number" || Number.isNaN(amountOrCents)) {
      throw new DomainValidationError("Amount must be a number");
    }

    // Convert to whole number (cents)
    const centsValue = Math.round(amountOrCents);
    const cur =
      typeof currency === "string" ? Currency.create(currency) : currency;
    return new Money(centsValue, cur);
  }

  static fromCents(cents: number, currency: Currency | string): Money {
    return Money.create(cents, currency);
  }

  static fromAmount(amount: number, currency: Currency | string): Money {
    // Convert dollars/euros to cents
    return Money.create(Math.round(amount * 100), currency);
  }

  getCents(): number {
    return this.cents;
  }

  getAmount(): number {
    return this.cents / 100; // convert cents to decimal
  }

  getCurrency(): Currency {
    return this.currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.cents - other.cents, this.currency);
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents > other.cents;
  }

  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents < other.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency.equals(other.currency);
  }

  private assertSameCurrency(other: Money) {
    if (!this.currency.equals(other.currency)) {
      throw new DomainValidationError("Currency mismatch");
    }
  }

  toString(): string {
    return `${this.currency.toString()} ${this.getAmount().toFixed(2)}`;
  }
}

export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string = "USD"
  ) {}

  static create(amount: number, currency: string = "USD"): Money {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }

    if (!currency || currency.trim().length === 0) {
      throw new Error("Currency cannot be empty");
    }

    // Round to 2 decimal places for currency
    const roundedAmount = Math.round(amount * 100) / 100;

    return new Money(roundedAmount, currency.toUpperCase().trim());
  }

  static zero(currency: string = "USD"): Money {
    return new Money(0, currency.toUpperCase().trim());
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const newAmount = this.amount - other.amount;
    if (newAmount < 0) {
      throw new Error("Result cannot be negative");
    }
    return new Money(newAmount, this.currency);
  }

  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new Error("Multiplier cannot be negative");
    }
    return new Money(this.amount * multiplier, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this.currency} and ${other.currency}`
      );
    }
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}

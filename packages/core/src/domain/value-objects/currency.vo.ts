import { DomainError } from "../domain-error";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
  CURRENCY_REGIONS,
  DEFAULT_CURRENCY,
  type SupportedCurrency,
} from "./currency.constants";

class InvalidCurrencyError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_CURRENCY", 400);
  }
}

export class Currency {
  private readonly value: SupportedCurrency;

  private constructor(value: string) {
    if (typeof value !== "string") throw new InvalidCurrencyError("Currency must be a string");
    if (!value) throw new InvalidCurrencyError("Currency is required");
    if (!Currency.isValidCurrency(value)) {
      throw new InvalidCurrencyError(`Unsupported currency code: ${value}`);
    }
    this.value = value;
  }

  static create(currency: string): Currency {
    const normalized = typeof currency === "string" ? currency.trim().toUpperCase() : currency;
    return new Currency(normalized);
  }

  static fromString(currency: string): Currency {
    return new Currency(currency);
  }

  static getDefaultCurrency(): Currency {
    return Currency.create(DEFAULT_CURRENCY);
  }

  static getAllSupportedCurrencies(): readonly string[] {
    return SUPPORTED_CURRENCIES;
  }

  static isValidCurrencyCode(currency: string): boolean {
    try {
      Currency.create(currency);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidCurrency(currency: string): currency is SupportedCurrency {
    return (SUPPORTED_CURRENCIES as readonly string[]).includes(currency);
  }

  getValue(): string {
    return this.value;
  }

  getDisplayName(): string {
    return CURRENCY_NAMES[this.value];
  }

  getSymbol(): string {
    return CURRENCY_SYMBOLS[this.value];
  }

  getMajorCurrencyRegion(): string {
    return CURRENCY_REGIONS[this.value];
  }

  isBaseCurrency(): boolean {
    return this.value === DEFAULT_CURRENCY;
  }

  equals(other: Currency): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

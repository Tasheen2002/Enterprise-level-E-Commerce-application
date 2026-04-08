import { SUPPORTED_CURRENCIES, MAJOR_CURRENCIES } from "../constants";
import { DomainValidationError } from "../errors/cart.errors";

export class Currency {
  private readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new DomainValidationError("Currency is required");
    }

    const upperCaseValue = value.toUpperCase().trim();

    if (!this.isValidCurrency(upperCaseValue)) {
      throw new DomainValidationError(
        `Unsupported currency: ${value}. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`,
      );
    }

    this.value = upperCaseValue;
  }

  private isValidCurrency(currency: string): boolean {
    return (SUPPORTED_CURRENCIES as readonly string[]).includes(currency);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Currency): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): Currency {
    return new Currency(value);
  }

  static getSupported(): string[] {
    return [...SUPPORTED_CURRENCIES];
  }

  // Currency utility methods
  isUSD(): boolean {
    return this.value === "USD";
  }

  isEUR(): boolean {
    return this.value === "EUR";
  }

  isMajorCurrency(): boolean {
    return (MAJOR_CURRENCIES as readonly string[]).includes(this.value);
  }

  getCurrencySymbol(): string {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "�",
      GBP: "�",
      JPY: "�",
      CAD: "C$",
      AUD: "A$",
      CHF: "CHF",
      CNY: "�",
      SEK: "kr",
      NZD: "NZ$",
      MXN: "$",
      SGD: "S$",
      HKD: "HK$",
      NOK: "kr",
      KRW: "�",
      TRY: "�",
      RUB: "�",
      INR: "�",
      BRL: "R$",
      ZAR: "R",
    };

    return symbols[this.value] || this.value;
  }

  getDisplayName(): string {
    const names: Record<string, string> = {
      USD: "US Dollar",
      EUR: "Euro",
      GBP: "British Pound",
      JPY: "Japanese Yen",
      CAD: "Canadian Dollar",
      AUD: "Australian Dollar",
      CHF: "Swiss Franc",
      CNY: "Chinese Yuan",
      SEK: "Swedish Krona",
      NZD: "New Zealand Dollar",
      MXN: "Mexican Peso",
      SGD: "Singapore Dollar",
      HKD: "Hong Kong Dollar",
      NOK: "Norwegian Krone",
      KRW: "South Korean Won",
      TRY: "Turkish Lira",
      RUB: "Russian Ruble",
      INR: "Indian Rupee",
      BRL: "Brazilian Real",
      ZAR: "South African Rand",
    };

    return names[this.value] || this.value;
  }

  // Common currency constants
  static USD(): Currency {
    return new Currency("USD");
  }

  static EUR(): Currency {
    return new Currency("EUR");
  }

  static GBP(): Currency {
    return new Currency("GBP");
  }
}

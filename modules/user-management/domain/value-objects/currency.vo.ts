import { DomainValidationError } from "../errors/user-management.errors";

export class Currency {
  private readonly value: string;

  private constructor(currency: string) {
    if (!currency) {
      throw new DomainValidationError("Currency is required");
    }

    const normalizedCurrency = currency.trim().toUpperCase();

    if (!this.isValidCurrency(normalizedCurrency)) {
      throw new DomainValidationError(
        `Invalid currency code: ${currency}. Must be a valid ISO 4217 code`,
      );
    }

    this.value = normalizedCurrency;
  }

  private isValidCurrency(currency: string): boolean {
    // ISO 4217 currency codes for e-commerce platform
    const validCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "JPY", // Japanese Yen
      "AUD", // Australian Dollar
      "CAD", // Canadian Dollar
      "CHF", // Swiss Franc
      "CNY", // Chinese Yuan
      "SEK", // Swedish Krona
      "NZD", // New Zealand Dollar
      "MXN", // Mexican Peso
      "SGD", // Singapore Dollar
      "HKD", // Hong Kong Dollar
      "NOK", // Norwegian Krone
      "TRY", // Turkish Lira
      "ZAR", // South African Rand
      "BRL", // Brazilian Real
      "INR", // Indian Rupee
      "KRW", // South Korean Won
      "PLN", // Polish Zloty
      "DKK", // Danish Krone
      "CZK", // Czech Koruna
      "HUF", // Hungarian Forint
      "RUB", // Russian Ruble
      "THB", // Thai Baht
      "ILS", // Israeli Shekel
      "CLP", // Chilean Peso
      "PHP", // Philippine Peso
      "AED", // UAE Dirham
      "SAR", // Saudi Riyal
    ];

    return validCurrencies.includes(currency);
  }

  getValue(): string {
    return this.value;
  }

  getDisplayName(): string {
    const currencyNames: Record<string, string> = {
      USD: "US Dollar",
      EUR: "Euro",
      GBP: "British Pound",
      JPY: "Japanese Yen",
      AUD: "Australian Dollar",
      CAD: "Canadian Dollar",
      CHF: "Swiss Franc",
      CNY: "Chinese Yuan",
      SEK: "Swedish Krona",
      NZD: "New Zealand Dollar",
      MXN: "Mexican Peso",
      SGD: "Singapore Dollar",
      HKD: "Hong Kong Dollar",
      NOK: "Norwegian Krone",
      TRY: "Turkish Lira",
      ZAR: "South African Rand",
      BRL: "Brazilian Real",
      INR: "Indian Rupee",
      KRW: "South Korean Won",
      PLN: "Polish Zloty",
      DKK: "Danish Krone",
      CZK: "Czech Koruna",
      HUF: "Hungarian Forint",
      RUB: "Russian Ruble",
      THB: "Thai Baht",
      ILS: "Israeli Shekel",
      CLP: "Chilean Peso",
      PHP: "Philippine Peso",
      AED: "UAE Dirham",
      SAR: "Saudi Riyal",
    };

    return currencyNames[this.value] || this.value;
  }

  getSymbol(): string {
    const currencySymbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "Fr",
      CNY: "¥",
      SEK: "kr",
      NZD: "NZ$",
      MXN: "$",
      SGD: "S$",
      HKD: "HK$",
      NOK: "kr",
      TRY: "₺",
      ZAR: "R",
      BRL: "R$",
      INR: "₹",
      KRW: "₩",
      PLN: "zł",
      DKK: "kr",
      CZK: "Kč",
      HUF: "Ft",
      RUB: "₽",
      THB: "฿",
      ILS: "₪",
      CLP: "$",
      PHP: "₱",
      AED: "د.إ",
      SAR: "﷼",
    };

    return currencySymbols[this.value] || this.value;
  }

  isBaseCurrency(): boolean {
    return this.value === "USD";
  }

  isCrypto(): boolean {
    // For future cryptocurrency support
    const cryptoCurrencies = ["BTC", "ETH", "LTC"];
    return cryptoCurrencies.includes(this.value);
  }

  getMajorCurrencyRegion(): string {
    const regions: Record<string, string> = {
      USD: "North America",
      CAD: "North America",
      MXN: "North America",
      EUR: "Europe",
      GBP: "Europe",
      CHF: "Europe",
      SEK: "Europe",
      NOK: "Europe",
      DKK: "Europe",
      CZK: "Europe",
      HUF: "Europe",
      PLN: "Europe",
      JPY: "Asia",
      CNY: "Asia",
      KRW: "Asia",
      SGD: "Asia",
      HKD: "Asia",
      THB: "Asia",
      INR: "Asia",
      PHP: "Asia",
      AUD: "Oceania",
      NZD: "Oceania",
      BRL: "South America",
      CLP: "South America",
      ZAR: "Africa",
      AED: "Middle East",
      SAR: "Middle East",
      ILS: "Middle East",
      TRY: "Middle East",
      RUB: "Europe",
    };

    return regions[this.value] || "Other";
  }

  equals(other: Currency): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(currency: string): Currency {
    return new Currency(currency);
  }

  static fromString(currency: string): Currency {
    return new Currency(currency);
  }

  static getDefaultCurrency(): Currency {
    return new Currency("USD");
  }

  static getAllSupportedCurrencies(): string[] {
    return [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "AUD",
      "CAD",
      "CHF",
      "CNY",
      "SEK",
      "NZD",
      "MXN",
      "SGD",
      "HKD",
      "NOK",
      "TRY",
      "ZAR",
      "BRL",
      "INR",
      "KRW",
      "PLN",
      "DKK",
      "CZK",
      "HUF",
      "RUB",
      "THB",
      "ILS",
      "CLP",
      "PHP",
      "AED",
      "SAR",
    ];
  }

  static isValidCurrencyCode(currency: string): boolean {
    try {
      Currency.create(currency);
      return true;
    } catch {
      return false;
    }
  }
}

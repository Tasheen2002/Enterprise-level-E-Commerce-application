import { DomainValidationError } from "../errors/user-management.errors";
import {
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  LANGUAGE_NAMES,
  COUNTRY_REGIONS,
  LOCALE_CURRENCY_MAP,
  RTL_LANGUAGES,
  LATIN_SCRIPT_LANGUAGES,
  DEFAULT_LOCALE,
  DEFAULT_LOCALE_CURRENCY,
} from "../constants/locale.constants";

export class Locale {
  private constructor(private readonly value: string) {
    if (!value) throw new DomainValidationError("Locale is required");
    if (!Locale.isValidLocale(value)) {
      throw new DomainValidationError(
        `Invalid locale format: ${value}. Use format like "en-US", "fr-FR", "de-DE"`,
      );
    }
  }

  static create(locale: string): Locale {
    return new Locale(locale.trim());
  }

  static fromString(locale: string): Locale {
    return new Locale(locale);
  }

  static getDefaultLocale(): Locale {
    return Locale.create(DEFAULT_LOCALE);
  }

  static getAllSupportedLocales(): readonly string[] {
    return SUPPORTED_LOCALES;
  }

  static isValidLocaleCode(locale: string): boolean {
    try {
      Locale.create(locale);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidLocale(locale: string): boolean {
    const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;
    if (!localeRegex.test(locale)) return false;
    return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
  }

  getValue(): string {
    return this.value;
  }

  getLanguageCode(): string {
    return this.value.split("-")[0];
  }

  getCountryCode(): string {
    return this.value.split("-")[1];
  }

  getDisplayName(): string {
    return LOCALE_NAMES[this.value] ?? this.value;
  }

  getLanguageName(): string {
    return LANGUAGE_NAMES[this.getLanguageCode()] ?? this.getLanguageCode();
  }

  getRegion(): string {
    return COUNTRY_REGIONS[this.getCountryCode()] ?? "Other";
  }

  getDefaultCurrency(): string {
    return LOCALE_CURRENCY_MAP[this.value] ?? DEFAULT_LOCALE_CURRENCY;
  }

  isRightToLeft(): boolean {
    return (RTL_LANGUAGES as readonly string[]).includes(this.getLanguageCode());
  }

  usesLatinScript(): boolean {
    return (LATIN_SCRIPT_LANGUAGES as readonly string[]).includes(this.getLanguageCode());
  }

  equals(other: Locale): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

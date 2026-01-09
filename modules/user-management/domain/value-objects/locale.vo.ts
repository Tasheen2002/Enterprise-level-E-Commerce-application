export class Locale {
  private readonly value: string;

  constructor(locale: string) {
    if (!locale) {
      throw new Error("Locale is required");
    }

    const normalizedLocale = locale.trim();

    if (!this.isValidLocale(normalizedLocale)) {
      throw new Error(
        `Invalid locale format: ${locale}. Use format like "en-US", "fr-FR", "de-DE"`
      );
    }

    this.value = normalizedLocale;
  }

  private isValidLocale(locale: string): boolean {
    // BCP 47 language tag format: language-country
    const localeRegex = /^[a-z]{2}-[A-Z]{2}$/;

    if (!localeRegex.test(locale)) {
      return false;
    }

    // Validate against supported locales for e-commerce platform
    const supportedLocales = [
      // English variants
      "en-US",
      "en-GB",
      "en-CA",
      "en-AU",
      "en-NZ",
      "en-IE",
      "en-ZA",
      "en-IN",
      "en-SG",

      // European languages
      "fr-FR",
      "fr-CA",
      "fr-BE",
      "fr-CH",
      "de-DE",
      "de-AT",
      "de-CH",
      "es-ES",
      "es-MX",
      "es-AR",
      "es-CL",
      "es-CO",
      "es-PE",
      "it-IT",
      "it-CH",
      "pt-BR",
      "pt-PT",
      "nl-NL",
      "nl-BE",
      "sv-SE",
      "no-NO",
      "da-DK",
      "fi-FI",
      "pl-PL",
      "cs-CZ",
      "hu-HU",
      "ru-RU",
      "tr-TR",

      // Asian languages
      "zh-CN",
      "zh-TW",
      "zh-HK",
      "ja-JP",
      "ko-KR",
      "th-TH",
      "vi-VN",
      "hi-IN",
      "ar-SA",
      "ar-AE",
      "ar-EG",
      "he-IL",

      // Other regions
      "id-ID",
      "ms-MY",
      "tl-PH",
    ];

    return supportedLocales.includes(locale);
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
    const localeNames: Record<string, string> = {
      "en-US": "English (United States)",
      "en-GB": "English (United Kingdom)",
      "en-CA": "English (Canada)",
      "en-AU": "English (Australia)",
      "en-NZ": "English (New Zealand)",
      "en-IE": "English (Ireland)",
      "en-ZA": "English (South Africa)",
      "en-IN": "English (India)",
      "en-SG": "English (Singapore)",

      "fr-FR": "Français (France)",
      "fr-CA": "Français (Canada)",
      "fr-BE": "Français (Belgium)",
      "fr-CH": "Français (Switzerland)",

      "de-DE": "Deutsch (Deutschland)",
      "de-AT": "Deutsch (Österreich)",
      "de-CH": "Deutsch (Schweiz)",

      "es-ES": "Español (España)",
      "es-MX": "Español (México)",
      "es-AR": "Español (Argentina)",
      "es-CL": "Español (Chile)",
      "es-CO": "Español (Colombia)",
      "es-PE": "Español (Perú)",

      "it-IT": "Italiano (Italia)",
      "it-CH": "Italiano (Svizzera)",

      "pt-BR": "Português (Brasil)",
      "pt-PT": "Português (Portugal)",

      "nl-NL": "Nederlands (Nederland)",
      "nl-BE": "Nederlands (België)",

      "sv-SE": "Svenska (Sverige)",
      "no-NO": "Norsk (Norge)",
      "da-DK": "Dansk (Danmark)",
      "fi-FI": "Suomi (Suomi)",
      "pl-PL": "Polski (Polska)",
      "cs-CZ": "Čeština (Česká republika)",
      "hu-HU": "Magyar (Magyarország)",
      "ru-RU": "Русский (Россия)",
      "tr-TR": "Türkçe (Türkiye)",

      "zh-CN": "中文 (中国)",
      "zh-TW": "中文 (台灣)",
      "zh-HK": "中文 (香港)",
      "ja-JP": "日本語 (日本)",
      "ko-KR": "한국어 (대한민국)",
      "th-TH": "ไทย (ไทย)",
      "vi-VN": "Tiếng Việt (Việt Nam)",
      "hi-IN": "हिन्दी (भारत)",
      "ar-SA": "العربية (السعودية)",
      "ar-AE": "العربية (الإمارات)",
      "ar-EG": "العربية (مصر)",
      "he-IL": "עברית (ישראל)",
      "id-ID": "Bahasa Indonesia (Indonesia)",
      "ms-MY": "Bahasa Melayu (Malaysia)",
      "tl-PH": "Filipino (Pilipinas)",
    };

    return localeNames[this.value] || this.value;
  }

  getLanguageName(): string {
    const languageNames: Record<string, string> = {
      en: "English",
      fr: "Français",
      de: "Deutsch",
      es: "Español",
      it: "Italiano",
      pt: "Português",
      nl: "Nederlands",
      sv: "Svenska",
      no: "Norsk",
      da: "Dansk",
      fi: "Suomi",
      pl: "Polski",
      cs: "Čeština",
      hu: "Magyar",
      ru: "Русский",
      tr: "Türkçe",
      zh: "中文",
      ja: "日本語",
      ko: "한국어",
      th: "ไทย",
      vi: "Tiếng Việt",
      hi: "हिन्दी",
      ar: "العربية",
      he: "עברית",
      id: "Bahasa Indonesia",
      ms: "Bahasa Melayu",
      tl: "Filipino",
    };

    return languageNames[this.getLanguageCode()] || this.getLanguageCode();
  }

  getRegion(): string {
    const regions: Record<string, string> = {
      US: "North America",
      CA: "North America",
      MX: "North America",
      GB: "Europe",
      IE: "Europe",
      FR: "Europe",
      DE: "Europe",
      AT: "Europe",
      CH: "Europe",
      ES: "Europe",
      IT: "Europe",
      PT: "Europe",
      NL: "Europe",
      BE: "Europe",
      SE: "Europe",
      NO: "Europe",
      DK: "Europe",
      FI: "Europe",
      PL: "Europe",
      CZ: "Europe",
      HU: "Europe",
      RU: "Europe",
      TR: "Middle East",
      CN: "Asia",
      TW: "Asia",
      HK: "Asia",
      JP: "Asia",
      KR: "Asia",
      TH: "Asia",
      VN: "Asia",
      IN: "Asia",
      SG: "Asia",
      ID: "Asia",
      MY: "Asia",
      PH: "Asia",
      AU: "Oceania",
      NZ: "Oceania",
      BR: "South America",
      AR: "South America",
      CL: "South America",
      CO: "South America",
      PE: "South America",
      ZA: "Africa",
      SA: "Middle East",
      AE: "Middle East",
      EG: "Africa",
      IL: "Middle East",
    };

    return regions[this.getCountryCode()] || "Other";
  }

  isRightToLeft(): boolean {
    const rtlLanguages = ["ar", "he"];
    return rtlLanguages.includes(this.getLanguageCode());
  }

  usesLatinScript(): boolean {
    const latinScriptLanguages = [
      "en",
      "fr",
      "de",
      "es",
      "it",
      "pt",
      "nl",
      "sv",
      "no",
      "da",
      "fi",
      "pl",
      "cs",
      "hu",
      "tr",
      "id",
      "ms",
      "tl",
      "vi",
    ];
    return latinScriptLanguages.includes(this.getLanguageCode());
  }

  getDefaultCurrency(): string {
    const localeCurrencyMap: Record<string, string> = {
      "en-US": "USD",
      "en-CA": "CAD",
      "en-GB": "GBP",
      "en-AU": "AUD",
      "en-NZ": "NZD",
      "en-IE": "EUR",
      "en-ZA": "ZAR",
      "en-IN": "INR",
      "en-SG": "SGD",
      "fr-FR": "EUR",
      "fr-CA": "CAD",
      "fr-BE": "EUR",
      "fr-CH": "CHF",
      "de-DE": "EUR",
      "de-AT": "EUR",
      "de-CH": "CHF",
      "es-ES": "EUR",
      "es-MX": "MXN",
      "es-AR": "ARS",
      "es-CL": "CLP",
      "es-CO": "COP",
      "es-PE": "PEN",
      "it-IT": "EUR",
      "it-CH": "CHF",
      "pt-BR": "BRL",
      "pt-PT": "EUR",
      "nl-NL": "EUR",
      "nl-BE": "EUR",
      "sv-SE": "SEK",
      "no-NO": "NOK",
      "da-DK": "DKK",
      "fi-FI": "EUR",
      "pl-PL": "PLN",
      "cs-CZ": "CZK",
      "hu-HU": "HUF",
      "ru-RU": "RUB",
      "tr-TR": "TRY",
      "zh-CN": "CNY",
      "zh-TW": "TWD",
      "zh-HK": "HKD",
      "ja-JP": "JPY",
      "ko-KR": "KRW",
      "th-TH": "THB",
      "vi-VN": "VND",
      "hi-IN": "INR",
      "ar-SA": "SAR",
      "ar-AE": "AED",
      "ar-EG": "EGP",
      "he-IL": "ILS",
      "id-ID": "IDR",
      "ms-MY": "MYR",
      "tl-PH": "PHP",
    };

    return localeCurrencyMap[this.value] || "USD";
  }

  equals(other: Locale): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(locale: string): Locale {
    return new Locale(locale);
  }

  static getDefaultLocale(): Locale {
    return new Locale("en-US");
  }

  static getAllSupportedLocales(): string[] {
    return [
      "en-US",
      "en-GB",
      "en-CA",
      "en-AU",
      "en-NZ",
      "en-IE",
      "en-ZA",
      "en-IN",
      "en-SG",
      "fr-FR",
      "fr-CA",
      "fr-BE",
      "fr-CH",
      "de-DE",
      "de-AT",
      "de-CH",
      "es-ES",
      "es-MX",
      "es-AR",
      "es-CL",
      "es-CO",
      "es-PE",
      "it-IT",
      "it-CH",
      "pt-BR",
      "pt-PT",
      "nl-NL",
      "nl-BE",
      "sv-SE",
      "no-NO",
      "da-DK",
      "fi-FI",
      "pl-PL",
      "cs-CZ",
      "hu-HU",
      "ru-RU",
      "tr-TR",
      "zh-CN",
      "zh-TW",
      "zh-HK",
      "ja-JP",
      "ko-KR",
      "th-TH",
      "vi-VN",
      "hi-IN",
      "ar-SA",
      "ar-AE",
      "ar-EG",
      "he-IL",
      "id-ID",
      "ms-MY",
      "tl-PH",
    ];
  }

  static isValidLocaleCode(locale: string): boolean {
    try {
      new Locale(locale);
      return true;
    } catch {
      return false;
    }
  }
}

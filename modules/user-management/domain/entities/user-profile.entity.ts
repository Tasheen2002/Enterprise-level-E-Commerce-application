import { UserId } from "../value-objects/user-id.vo";
import { Currency } from "../value-objects/currency.vo";
import { Locale } from "../value-objects/locale.vo";

export class UserProfile {
  private constructor(
    private readonly userId: UserId,
    private defaultAddressId: string | null,
    private defaultPaymentMethodId: string | null,
    private preferences: UserPreferences,
    private locale: Locale | null,
    private currency: Currency | null,
    private stylePreferences: StylePreferences,
    private preferredSizes: PreferredSizes
  ) {}

  // Factory methods
  static create(data: CreateUserProfileData): UserProfile {
    const userId = UserId.fromString(data.userId);

    return new UserProfile(
      userId,
      data.defaultAddressId || null,
      data.defaultPaymentMethodId || null,
      data.preferences || {},
      data.locale ? new Locale(data.locale) : null,
      data.currency
        ? new Currency(data.currency)
        : Currency.getDefaultCurrency(),
      data.stylePreferences || {},
      data.preferredSizes || {}
    );
  }

  static reconstitute(data: UserProfileData): UserProfile {
    return new UserProfile(
      UserId.fromString(data.userId),
      data.defaultAddressId,
      data.defaultPaymentMethodId,
      data.preferences,
      data.locale ? new Locale(data.locale) : null,
      data.currency ? new Currency(data.currency) : null,
      data.stylePreferences,
      data.preferredSizes
    );
  }

  // Add this method to map database row to UserProfile
  static fromDatabaseRow(row: UserProfileRow): UserProfile {
    console.log("[DEBUG ENTITY] fromDatabaseRow input:", {
      prefs: row.prefs,
      style_preferences: row.style_preferences,
      preferred_sizes: row.preferred_sizes,
    });

    return new UserProfile(
      UserId.fromString(row.user_id),
      row.default_address_id,
      row.default_payment_method_id,
      row.prefs, // Maps database "prefs" to entity "preferences"
      row.locale ? new Locale(row.locale) : null,
      row.currency ? new Currency(row.currency) : null,
      row.style_preferences,
      row.preferred_sizes
    );
  }

  // Getters
  getUserId(): UserId {
    return this.userId;
  }
  getDefaultAddressId(): string | null {
    return this.defaultAddressId;
  }
  getDefaultPaymentMethodId(): string | null {
    return this.defaultPaymentMethodId;
  }
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }
  getLocale(): Locale | null {
    return this.locale;
  }
  getCurrency(): Currency | null {
    return this.currency;
  }
  getStylePreferences(): StylePreferences {
    return { ...this.stylePreferences };
  }
  getPreferredSizes(): PreferredSizes {
    return { ...this.preferredSizes };
  }

  // Address management
  setDefaultAddress(addressId: string): void {
    if (!addressId) {
      throw new Error("Address ID is required");
    }

    this.defaultAddressId = addressId;
  }

  removeDefaultAddress(): void {
    this.defaultAddressId = null;
  }

  hasDefaultAddress(): boolean {
    return !!this.defaultAddressId;
  }

  // Payment method management
  setDefaultPaymentMethod(paymentMethodId: string): void {
    if (!paymentMethodId) {
      throw new Error("Payment method ID is required");
    }

    this.defaultPaymentMethodId = paymentMethodId;
  }

  removeDefaultPaymentMethod(): void {
    this.defaultPaymentMethodId = null;
  }

  hasDefaultPaymentMethod(): boolean {
    return !!this.defaultPaymentMethodId;
  }

  // Locale and currency management
  setLocale(locale: string): void {
    const localeVO = new Locale(locale);
    this.locale = localeVO;
  }

  setCurrency(currency: string): void {
    const currencyVO = new Currency(currency);
    this.currency = currencyVO;
  }

  // Preferences management
  updatePreference(key: string, value: any): void {
    if (!key) {
      throw new Error("Preference key is required");
    }

    this.preferences = {
      ...this.preferences,
      [key]: value,
    };
  }

  setPreferences(preferences: UserPreferences): void {
    this.preferences = { ...preferences };
  }

  removePreference(key: string): void {
    if (!key) {
      throw new Error("Preference key is required");
    }

    const { [key]: removed, ...remainingPreferences } = this.preferences;
    this.preferences = remainingPreferences;
  }

  getPreference(key: string): any {
    return this.preferences[key];
  }

  // Style preferences management
  updateStylePreference(category: string, preferences: any): void {
    if (!category) {
      throw new Error("Style category is required");
    }

    this.stylePreferences = {
      ...this.stylePreferences,
      [category]: preferences,
    };
  }

  setStylePreferences(stylePreferences: StylePreferences): void {
    this.stylePreferences = { ...stylePreferences };
  }

  getStylePreference(category: string): any {
    return this.stylePreferences[category];
  }

  // Common style preference methods
  setFavoriteColors(colors: string[]): void {
    this.updateStylePreference("favoriteColors", colors);
  }

  getFavoriteColors(): string[] {
    return this.getStylePreference("favoriteColors") || [];
  }

  setFavoriteBrands(brands: string[]): void {
    this.updateStylePreference("favoriteBrands", brands);
  }

  getFavoriteBrands(): string[] {
    return this.getStylePreference("favoriteBrands") || [];
  }

  setStyleTypes(styles: string[]): void {
    this.updateStylePreference("styleTypes", styles);
  }

  getStyleTypes(): string[] {
    return this.getStylePreference("styleTypes") || [];
  }

  // Size preferences management
  updatePreferredSize(category: string, size: string): void {
    if (!category || !size) {
      throw new Error("Category and size are required");
    }

    this.preferredSizes = {
      ...this.preferredSizes,
      [category]: size,
    };
  }

  setPreferredSizes(preferredSizes: PreferredSizes): void {
    this.preferredSizes = { ...preferredSizes };
  }

  getPreferredSize(category: string): string | undefined {
    return this.preferredSizes[category];
  }

  // Common size categories
  setShirtSize(size: string): void {
    this.updatePreferredSize("shirt", size);
  }

  setPantSize(size: string): void {
    this.updatePreferredSize("pants", size);
  }

  setShoeSize(size: string): void {
    this.updatePreferredSize("shoes", size);
  }

  setSuitSize(size: string): void {
    this.updatePreferredSize("suit", size);
  }

  getShirtSize(): string | undefined {
    return this.getPreferredSize("shirt");
  }

  getPantSize(): string | undefined {
    return this.getPreferredSize("pants");
  }

  getShoeSize(): string | undefined {
    return this.getPreferredSize("shoes");
  }

  getSuitSize(): string | undefined {
    return this.getPreferredSize("suit");
  }

  // Profile completeness
  isComplete(): boolean {
    return !!(
      this.locale &&
      this.currency &&
      this.defaultAddressId &&
      this.hasBasicSizes()
    );
  }

  private hasBasicSizes(): boolean {
    return !!(this.getShirtSize() && this.getPantSize() && this.getShoeSize());
  }

  getCompletionPercentage(): number {
    let score = 0;
    const totalFields = 6;

    if (this.locale) score++;
    if (this.currency) score++;
    if (this.defaultAddressId) score++;
    if (this.defaultPaymentMethodId) score++;
    if (this.hasBasicSizes()) score++;
    if (this.getFavoriteColors().length > 0) score++;

    return Math.round((score / totalFields) * 100);
  }

  // Business methods
  belongsToUser(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  isSetupForShopping(): boolean {
    return !!(this.defaultAddressId && this.defaultPaymentMethodId);
  }

  // Convert to data for persistence
  toData(): UserProfileData {
    return {
      userId: this.userId.getValue(),
      defaultAddressId: this.defaultAddressId,
      defaultPaymentMethodId: this.defaultPaymentMethodId,
      preferences: this.preferences,
      locale: this.locale?.getValue() || null,
      currency: this.currency?.getValue() || null,
      stylePreferences: this.stylePreferences,
      preferredSizes: this.preferredSizes,
    };
  }

  // Add this method for database-compatible persistence
  toDatabaseRow(): UserProfileRow {
    const row = {
      user_id: this.userId.getValue(),
      default_address_id: this.defaultAddressId,
      default_payment_method_id: this.defaultPaymentMethodId,
      prefs: this.preferences, // Maps entity "preferences" to database "prefs"
      locale: this.locale?.getValue() || null,
      currency: this.currency?.getValue() || null,
      style_preferences: this.stylePreferences,
      preferred_sizes: this.preferredSizes,
    };

    console.log("[DEBUG ENTITY] toDatabaseRow output:", {
      prefs: row.prefs,
      style_preferences: row.style_preferences,
      preferred_sizes: row.preferred_sizes,
    });

    return row;
  }

  equals(other: UserProfile): boolean {
    return this.userId.equals(other.userId);
  }
}

// Supporting types and interfaces
export interface CreateUserProfileData {
  userId: string;
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  preferences?: UserPreferences;
  locale?: string;
  currency?: string;
  stylePreferences?: StylePreferences;
  preferredSizes?: PreferredSizes;
}

export interface UserProfileData {
  userId: string;
  defaultAddressId: string | null;
  defaultPaymentMethodId: string | null;
  preferences: UserPreferences;
  locale: string | null;
  currency: string | null;
  stylePreferences: StylePreferences;
  preferredSizes: PreferredSizes;
}

export interface UserPreferences {
  [key: string]: any;
  // Common preferences
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  promotionalEmails?: boolean;
  orderUpdates?: boolean;
  newsletter?: boolean;
  recommendations?: boolean;
  darkMode?: boolean;
  language?: string;
}

export interface StylePreferences {
  [key: string]: any;
  // Common style preferences
  favoriteColors?: string[];
  favoriteBrands?: string[];
  styleTypes?: string[]; // casual, formal, business, sporty
  occasionPreferences?: string[]; // work, weekend, special_events
  fitPreferences?: string[]; // slim, regular, loose
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface PreferredSizes {
  [category: string]: string | SizeSystem | undefined;
  // Common size categories
  shirt?: string;
  pants?: string;
  shoes?: string;
  suit?: string;
  jacket?: string;
  dress?: string;
  // International size preferences
  shirtSizeSystem?: SizeSystem;
  pantsSizeSystem?: SizeSystem;
  shoesSizeSystem?: SizeSystem;
}

export type SizeSystem = "US" | "EU" | "UK" | "Asian";

// Database row interface matching PostgreSQL schema
export interface UserProfileRow {
  user_id: string;
  default_address_id: string | null;
  default_payment_method_id: string | null;
  prefs: UserPreferences; // Maps to database "prefs" column (JSONB)
  locale: string | null;
  currency: string | null;
  style_preferences: StylePreferences; // JSONB
  preferred_sizes: PreferredSizes; // JSONB
}

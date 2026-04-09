import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { UserId } from "../value-objects/user-id.vo";
import { Currency } from "../value-objects/currency.vo";
import { Locale } from "../value-objects/locale.vo";
import { InvalidOperationError } from "../errors/user-management.errors";

// Props interface
export interface UserProfileProps {
  userId: UserId;
  defaultAddressId: string | null;
  defaultPaymentMethodId: string | null;
  preferences: UserPreferences;
  locale: Locale | null;
  currency: Currency | null;
  stylePreferences: StylePreferences;
  preferredSizes: PreferredSizes;
}

export class UserProfile extends AggregateRoot {
  private props: UserProfileProps;

  private constructor(props: UserProfileProps) {
    super();
    this.props = props;
  }

  // Factory methods
  static create(params: {
    userId: string;
    defaultAddressId?: string;
    defaultPaymentMethodId?: string;
    preferences?: UserPreferences;
    locale?: string;
    currency?: string;
    stylePreferences?: StylePreferences;
    preferredSizes?: PreferredSizes;
  }): UserProfile {
    return new UserProfile({
      userId: UserId.fromString(params.userId),
      defaultAddressId: params.defaultAddressId || null,
      defaultPaymentMethodId: params.defaultPaymentMethodId || null,
      preferences: params.preferences || {},
      locale: params.locale ? new Locale(params.locale) : null,
      currency: params.currency
        ? new Currency(params.currency)
        : Currency.getDefaultCurrency(),
      stylePreferences: params.stylePreferences || {},
      preferredSizes: params.preferredSizes || {},
    });
  }

  static reconstitute(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  // Getters
  getUserId(): UserId {
    return this.props.userId;
  }
  getDefaultAddressId(): string | null {
    return this.props.defaultAddressId;
  }
  getDefaultPaymentMethodId(): string | null {
    return this.props.defaultPaymentMethodId;
  }
  getPreferences(): UserPreferences {
    return { ...this.props.preferences };
  }
  getLocale(): Locale | null {
    return this.props.locale;
  }
  getCurrency(): Currency | null {
    return this.props.currency;
  }
  getStylePreferences(): StylePreferences {
    return { ...this.props.stylePreferences };
  }
  getPreferredSizes(): PreferredSizes {
    return { ...this.props.preferredSizes };
  }

  // Address management
  setDefaultAddress(addressId: string): void {
    if (!addressId) {
      throw new InvalidOperationError("Address ID is required");
    }

    this.props.defaultAddressId = addressId;
  }

  removeDefaultAddress(): void {
    this.props.defaultAddressId = null;
  }

  hasDefaultAddress(): boolean {
    return !!this.props.defaultAddressId;
  }

  // Payment method management
  setDefaultPaymentMethod(paymentMethodId: string): void {
    if (!paymentMethodId) {
      throw new InvalidOperationError("Payment method ID is required");
    }

    this.props.defaultPaymentMethodId = paymentMethodId;
  }

  removeDefaultPaymentMethod(): void {
    this.props.defaultPaymentMethodId = null;
  }

  hasDefaultPaymentMethod(): boolean {
    return !!this.props.defaultPaymentMethodId;
  }

  // Locale and currency management
  setLocale(locale: string): void {
    const localeVO = new Locale(locale);
    this.props.locale = localeVO;
  }

  setCurrency(currency: string): void {
    const currencyVO = new Currency(currency);
    this.props.currency = currencyVO;
  }

  // Preferences management
  updatePreference(key: string, value: any): void {
    if (!key) {
      throw new InvalidOperationError("Preference key is required");
    }

    this.props.preferences = {
      ...this.props.preferences,
      [key]: value,
    };
  }

  setPreferences(preferences: UserPreferences): void {
    this.props.preferences = { ...preferences };
  }

  removePreference(key: string): void {
    if (!key) {
      throw new InvalidOperationError("Preference key is required");
    }

    const { [key]: removed, ...remainingPreferences } = this.props.preferences;
    this.props.preferences = remainingPreferences;
  }

  getPreference(key: string): any {
    return this.props.preferences[key];
  }

  // Style preferences management
  updateStylePreference(category: string, preferences: any): void {
    if (!category) {
      throw new InvalidOperationError("Style category is required");
    }

    this.props.stylePreferences = {
      ...this.props.stylePreferences,
      [category]: preferences,
    };
  }

  setStylePreferences(stylePreferences: StylePreferences): void {
    this.props.stylePreferences = { ...stylePreferences };
  }

  getStylePreference(category: string): any {
    return this.props.stylePreferences[category];
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
      throw new InvalidOperationError("Category and size are required");
    }

    this.props.preferredSizes = {
      ...this.props.preferredSizes,
      [category]: size,
    };
  }

  setPreferredSizes(preferredSizes: PreferredSizes): void {
    this.props.preferredSizes = { ...preferredSizes };
  }

  getPreferredSize(category: string): string | undefined {
    return this.props.preferredSizes[category];
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
      this.props.locale &&
      this.props.currency &&
      this.props.defaultAddressId &&
      this.hasBasicSizes()
    );
  }

  private hasBasicSizes(): boolean {
    return !!(this.getShirtSize() && this.getPantSize() && this.getShoeSize());
  }

  getCompletionPercentage(): number {
    let score = 0;
    const totalFields = 6;

    if (this.props.locale) score++;
    if (this.props.currency) score++;
    if (this.props.defaultAddressId) score++;
    if (this.props.defaultPaymentMethodId) score++;
    if (this.hasBasicSizes()) score++;
    if (this.getFavoriteColors().length > 0) score++;

    return Math.round((score / totalFields) * 100);
  }

  // Business methods
  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  isSetupForShopping(): boolean {
    return !!(this.props.defaultAddressId && this.props.defaultPaymentMethodId);
  }

  // Static DTO conversion — called by service, NEVER by handler or controller
  static toDTO(profile: UserProfile): UserProfileDTO {
    return {
      userId: profile.props.userId.getValue(),
      defaultAddressId: profile.props.defaultAddressId,
      defaultPaymentMethodId: profile.props.defaultPaymentMethodId,
      preferences: { ...profile.props.preferences },
      locale: profile.props.locale?.getValue() || null,
      currency: profile.props.currency?.getValue() || null,
      stylePreferences: { ...profile.props.stylePreferences },
      preferredSizes: { ...profile.props.preferredSizes },
    };
  }

  equals(other: UserProfile): boolean {
    return this.props.userId.equals(other.props.userId);
  }
}

// Supporting types and interfaces
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

// DTO Interface
export interface UserProfileDTO {
  userId: string;
  defaultAddressId: string | null;
  defaultPaymentMethodId: string | null;
  preferences: UserPreferences;
  locale: string | null;
  currency: string | null;
  stylePreferences: StylePreferences;
  preferredSizes: PreferredSizes;
}

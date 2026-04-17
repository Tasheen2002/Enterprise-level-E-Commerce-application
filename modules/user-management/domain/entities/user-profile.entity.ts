import { UserId } from "../value-objects/user-id.vo";
import { Currency } from "../value-objects/currency.vo";
import { Locale } from "../value-objects/locale.vo";
import { InvalidOperationError } from "../errors/user-management.errors";

// ============================================================================
// Props Interface
// ============================================================================

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

// ============================================================================
// DTO Interface
// ============================================================================

export interface UserProfileDTO {
  userId: string;
  defaultAddressId: string | null;
  defaultPaymentMethodId: string | null;
  preferences: UserPreferences;
  locale: string | null;
  currency: string | null;
  stylePreferences: StylePreferences;
  preferredSizes: PreferredSizes;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  title?: string | null;
  dateOfBirth?: string | null;
  residentOf?: string | null;
  nationality?: string | null;
}

// ============================================================================
// Entity
// ============================================================================

export class UserProfile {
  private constructor(private props: UserProfileProps) {}

  // --- Static factories ---

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
      locale: params.locale ? Locale.fromString(params.locale) : null,
      currency: params.currency
        ? Currency.fromString(params.currency)
        : Currency.getDefaultCurrency(),
      stylePreferences: params.stylePreferences || {},
      preferredSizes: params.preferredSizes || {},
    });
  }

  static fromPersistence(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  // --- Native getters ---

  get userId(): UserId {
    return this.props.userId;
  }
  get defaultAddressId(): string | null {
    return this.props.defaultAddressId;
  }
  get defaultPaymentMethodId(): string | null {
    return this.props.defaultPaymentMethodId;
  }
  get preferences(): UserPreferences {
    return { ...this.props.preferences };
  }
  get locale(): Locale | null {
    return this.props.locale;
  }
  get currency(): Currency | null {
    return this.props.currency;
  }
  get stylePreferences(): StylePreferences {
    return { ...this.props.stylePreferences };
  }
  get preferredSizes(): PreferredSizes {
    return { ...this.props.preferredSizes };
  }

  // --- Business methods ---

  setDefaultAddress(addressId: string): void {
    if (!addressId) throw new InvalidOperationError("Address ID is required");
    this.props.defaultAddressId = addressId;
  }

  removeDefaultAddress(): void {
    this.props.defaultAddressId = null;
  }

  hasDefaultAddress(): boolean {
    return !!this.props.defaultAddressId;
  }

  setDefaultPaymentMethod(paymentMethodId: string): void {
    if (!paymentMethodId)
      throw new InvalidOperationError("Payment method ID is required");
    this.props.defaultPaymentMethodId = paymentMethodId;
  }

  removeDefaultPaymentMethod(): void {
    this.props.defaultPaymentMethodId = null;
  }

  hasDefaultPaymentMethod(): boolean {
    return !!this.props.defaultPaymentMethodId;
  }

  setLocale(locale: string): void {
    this.props.locale = Locale.fromString(locale);
  }

  setCurrency(currency: string): void {
    this.props.currency = Currency.fromString(currency);
  }

  updatePreference(key: string, value: unknown): void {
    if (!key) throw new InvalidOperationError("Preference key is required");
    this.props.preferences = { ...this.props.preferences, [key]: value };
  }

  setPreferences(preferences: UserPreferences): void {
    this.props.preferences = { ...preferences };
  }

  removePreference(key: string): void {
    if (!key) throw new InvalidOperationError("Preference key is required");
    const { [key]: _removed, ...rest } = this.props.preferences;
    this.props.preferences = rest;
  }

  getPreference(key: string): unknown {
    return this.props.preferences[key];
  }

  updateStylePreference(category: string, preferences: unknown): void {
    if (!category)
      throw new InvalidOperationError("Style category is required");
    this.props.stylePreferences = {
      ...this.props.stylePreferences,
      [category]: preferences,
    };
  }

  setStylePreferences(stylePreferences: StylePreferences): void {
    this.props.stylePreferences = { ...stylePreferences };
  }

  getStylePreference(category: string): unknown {
    return this.props.stylePreferences[category];
  }

  setFavoriteColors(colors: string[]): void {
    this.updateStylePreference("favoriteColors", colors);
  }
  getFavoriteColors(): string[] {
    return (this.getStylePreference("favoriteColors") as string[]) || [];
  }
  setFavoriteBrands(brands: string[]): void {
    this.updateStylePreference("favoriteBrands", brands);
  }
  getFavoriteBrands(): string[] {
    return (this.getStylePreference("favoriteBrands") as string[]) || [];
  }
  setStyleTypes(styles: string[]): void {
    this.updateStylePreference("styleTypes", styles);
  }
  getStyleTypes(): string[] {
    return (this.getStylePreference("styleTypes") as string[]) || [];
  }

  updatePreferredSize(category: string, size: string): void {
    if (!category || !size)
      throw new InvalidOperationError("Category and size are required");
    this.props.preferredSizes = {
      ...this.props.preferredSizes,
      [category]: size,
    };
  }

  setPreferredSizes(preferredSizes: PreferredSizes): void {
    this.props.preferredSizes = { ...preferredSizes };
  }

  getPreferredSize(category: string): string | undefined {
    return this.props.preferredSizes[category] as string | undefined;
  }

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

  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  isSetupForShopping(): boolean {
    return !!(this.props.defaultAddressId && this.props.defaultPaymentMethodId);
  }

  equals(other: UserProfile): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  // --- Static DTO mapper ---

  static toDTO(profile: UserProfile): UserProfileDTO {
    return {
      userId: profile.userId.getValue(),
      defaultAddressId: profile.defaultAddressId,
      defaultPaymentMethodId: profile.defaultPaymentMethodId,
      preferences: { ...profile.props.preferences },
      locale: profile.locale?.getValue() || null,
      currency: profile.currency?.getValue() || null,
      stylePreferences: { ...profile.props.stylePreferences },
      preferredSizes: { ...profile.props.preferredSizes },
    };
  }
}

// ============================================================================
// Supporting types
// ============================================================================

export interface UserPreferences extends Record<string, unknown> {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  promotionalEmails?: boolean;
  orderUpdates?: boolean;
  newsletter?: boolean;
  recommendations?: boolean;
  darkMode?: boolean;
  language?: string;
}

export interface StylePreferences extends Record<string, unknown> {
  favoriteColors?: string[];
  favoriteBrands?: string[];
  styleTypes?: string[];
  occasionPreferences?: string[];
  fitPreferences?: string[];
  priceRange?: { min: number; max: number };
}

export interface PreferredSizes {
  [category: string]: string | SizeSystem | undefined;
  shirt?: string;
  pants?: string;
  shoes?: string;
  suit?: string;
  jacket?: string;
  dress?: string;
  shirtSizeSystem?: SizeSystem;
  pantsSizeSystem?: SizeSystem;
  shoesSizeSystem?: SizeSystem;
}

export type SizeSystem = "US" | "EU" | "UK" | "Asian";

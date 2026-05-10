import { UserId } from "../value-objects/user-id.vo";
import { AddressId } from "../value-objects/address-id.vo";
import { PaymentMethodId } from "../value-objects/payment-method-id.vo";
import { Currency } from "../value-objects";
import { Locale } from "../value-objects/locale.vo";
import { InvalidOperationError } from "../errors/user-management.errors";

// ============================================================================
// Props Interface
// ============================================================================

export interface UserProfileProps {
  userId: UserId;
  defaultAddressId: AddressId | null;
  defaultPaymentMethodId: PaymentMethodId | null;
  // Public ImageKit URL of the user's profile photo. Null = no avatar
  // saved (frontend falls back to a placeholder).
  avatarUrl: string | null;
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
  avatarUrl: string | null;
  preferences: UserPreferences;
  locale: string | null;
  currency: string | null;
  stylePreferences: StylePreferences;
  preferredSizes: PreferredSizes;
}

// ============================================================================
// Entity (plain class — user settings/preferences, no AggregateRoot, no events)
// ============================================================================

export class UserProfile {
  private constructor(private props: UserProfileProps) { }

  // --- Static factories ---

  static create(params: {
    userId: string;
    defaultAddressId?: string;
    defaultPaymentMethodId?: string;
    avatarUrl?: string;
    preferences?: UserPreferences;
    locale?: string;
    currency?: string;
    stylePreferences?: StylePreferences;
    preferredSizes?: PreferredSizes;
  }): UserProfile {
    return new UserProfile({
      userId: UserId.fromString(params.userId),
      defaultAddressId: params.defaultAddressId ? AddressId.fromString(params.defaultAddressId) : null,
      defaultPaymentMethodId: params.defaultPaymentMethodId ? PaymentMethodId.fromString(params.defaultPaymentMethodId) : null,
      avatarUrl: params.avatarUrl ?? null,
      preferences: params.preferences ?? {},
      locale: params.locale ? Locale.fromString(params.locale) : null,
      currency: params.currency
        ? Currency.fromString(params.currency)
        : Currency.getDefaultCurrency(),
      stylePreferences: params.stylePreferences ?? {},
      preferredSizes: params.preferredSizes ?? {},
    });
  }

  static fromPersistence(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  // --- Native getters ---

  get userId(): UserId { return this.props.userId; }
  get defaultAddressId(): AddressId | null { return this.props.defaultAddressId; }
  get defaultPaymentMethodId(): PaymentMethodId | null { return this.props.defaultPaymentMethodId; }
  get avatarUrl(): string | null { return this.props.avatarUrl; }
  get preferences(): UserPreferences { return { ...this.props.preferences }; }
  get locale(): Locale | null { return this.props.locale; }
  get currency(): Currency | null { return this.props.currency; }
  get stylePreferences(): StylePreferences { return { ...this.props.stylePreferences }; }
  get preferredSizes(): PreferredSizes { return { ...this.props.preferredSizes }; }

  // --- Business methods ---

  setDefaultAddress(addressId: string): void {
    if (!addressId) throw new InvalidOperationError("Address ID is required");
    this.props.defaultAddressId = AddressId.fromString(addressId);
  }

  removeDefaultAddress(): void {
    this.props.defaultAddressId = null;
  }

  setDefaultPaymentMethod(paymentMethodId: string): void {
    if (!paymentMethodId) {
      throw new InvalidOperationError("Payment method ID is required");
    }
    this.props.defaultPaymentMethodId = PaymentMethodId.fromString(paymentMethodId);
  }

  removeDefaultPaymentMethod(): void {
    this.props.defaultPaymentMethodId = null;
  }

  setAvatarUrl(url: string | null): void {
    // Allow `null` (explicit removal) and any non-empty string. We don't
    // validate the URL here — the upload-token flow only ever produces
    // ImageKit URLs, and admin / migration paths may carry historical
    // values from other CDNs.
    this.props.avatarUrl = url && url.length > 0 ? url : null;
  }

  setLocale(locale: string): void {
    this.props.locale = Locale.fromString(locale);
  }

  setCurrency(currency: string): void {
    this.props.currency = Currency.fromString(currency);
  }

  setPreferences(preferences: UserPreferences): void {
    this.props.preferences = { ...preferences };
  }

  updatePreference(key: string, value: unknown): void {
    if (!key) throw new InvalidOperationError("Preference key is required");
    this.props.preferences = { ...this.props.preferences, [key]: value };
  }

  removePreference(key: string): void {
    if (!key) throw new InvalidOperationError("Preference key is required");
    const { [key]: _removed, ...rest } = this.props.preferences;
    this.props.preferences = rest;
  }

  setStylePreferences(stylePreferences: StylePreferences): void {
    this.props.stylePreferences = { ...stylePreferences };
  }

  updateStylePreference(category: string, preferences: unknown): void {
    if (!category) throw new InvalidOperationError("Style category is required");
    this.props.stylePreferences = {
      ...this.props.stylePreferences,
      [category]: preferences,
    };
  }

  setPreferredSizes(preferredSizes: PreferredSizes): void {
    this.props.preferredSizes = { ...preferredSizes };
  }

  updatePreferredSize(category: string, size: string): void {
    if (!category || !size) {
      throw new InvalidOperationError("Category and size are required");
    }
    this.props.preferredSizes = {
      ...this.props.preferredSizes,
      [category]: size,
    };
  }

  // --- Query methods ---

  hasDefaultAddress(): boolean {
    return !!this.props.defaultAddressId;
  }

  hasDefaultPaymentMethod(): boolean {
    return !!this.props.defaultPaymentMethodId;
  }

  getPreference(key: string): unknown {
    return this.props.preferences[key];
  }

  getStylePreference(category: string): unknown {
    return this.props.stylePreferences[category];
  }

  getPreferredSize(category: string): string | undefined {
    return this.props.preferredSizes[category] as string | undefined;
  }

  belongsToUser(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  isSetupForShopping(): boolean {
    return !!(this.props.defaultAddressId && this.props.defaultPaymentMethodId);
  }

  isComplete(): boolean {
    return !!(
      this.props.locale &&
      this.props.currency &&
      this.props.defaultAddressId &&
      this.hasBasicSizes()
    );
  }

  getCompletionPercentage(): number {
    let score = 0;
    const totalFields = 6;
    if (this.props.locale) score++;
    if (this.props.currency) score++;
    if (this.props.defaultAddressId) score++;
    if (this.props.defaultPaymentMethodId) score++;
    if (this.hasBasicSizes()) score++;
    if ((this.getStylePreference("favoriteColors") as string[] | undefined)?.length) score++;
    return Math.round((score / totalFields) * 100);
  }

  private hasBasicSizes(): boolean {
    return !!(
      this.getPreferredSize("shirt") &&
      this.getPreferredSize("pants") &&
      this.getPreferredSize("shoes")
    );
  }

  equals(other: UserProfile): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  // --- Static DTO mapper ---

  static toDTO(profile: UserProfile): UserProfileDTO {
    return {
      userId: profile.props.userId.getValue(),
      defaultAddressId: profile.props.defaultAddressId?.getValue() ?? null,
      defaultPaymentMethodId: profile.props.defaultPaymentMethodId?.getValue() ?? null,
      avatarUrl: profile.props.avatarUrl,
      preferences: { ...profile.props.preferences },
      locale: profile.props.locale?.getValue() ?? null,
      currency: profile.props.currency?.getValue() ?? null,
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

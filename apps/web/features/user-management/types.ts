export type UserRole = "CUSTOMER" | "ADMIN" | "STAFF" | "GUEST";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole | string;
  isGuest: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
}

/**
 * Login response from `/auth/login`. The discriminated `kind` lets the
 * client tell whether the user is fully signed in or still owes a 2FA
 * code. The 2FA branch carries a short-lived (5 min) pending token
 * that the second step exchanges via `/auth/2fa/verify`.
 */
export type LoginResponse =
  | (AuthResult & { kind: "success" })
  | { kind: "two_factor_required"; pendingToken: string };

export interface UserIdentity {
  userId: string;
  email: string;
  role: string;
  isGuest: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  updatedAt?: string;
  createdAt?: string;
}

/** Plaintext backup codes — returned ONLY by enable + regenerate. */
export interface BackupCodesResult {
  backupCodes: string[];
}

export interface Setup2FAResult {
  /** Base32 secret, for users who can't scan the QR. */
  secret: string;
  /** Pre-rendered base64 PNG; drop into an `<img src>` directly. */
  qrCodeDataUrl: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  title?: string;
  dateOfBirth?: string;
  residentOf?: string;
  nationality?: string;
  locale: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  // Public ImageKit URL of the user's profile photo. Null/undefined =
  // no avatar saved (UI shows placeholder).
  avatarUrl?: string | null;
  prefs?: Record<string, unknown>;
  stylePreferences?: Record<string, unknown>;
  preferredSizes?: Record<string, string | undefined>;
}

/** Signed ImageKit upload params returned by /users/me/profile/avatar/upload-token. */
export interface AvatarUploadToken {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  folder: string;
  uploadEndpoint: string;
}

export type AddressType = "shipping" | "billing";

export interface Address {
  id: string;
  userId: string;
  type: AddressType;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  createdAt: string;
}

export interface AddressRequest {
  type: AddressType;
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export type PaymentMethodType = "CARD" | "PAYPAL" | "STRIPE_IDEAL";

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  isDefault: boolean;
  displayName: string;
  expiryDisplay: string;
  isExpired: boolean;
  createdAt: string;
}

export interface PaymentMethodRequest {
  type: PaymentMethodType;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  isDefault?: boolean;
  providerRef?: string;
}

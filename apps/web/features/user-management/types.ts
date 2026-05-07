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

export interface UserIdentity {
  userId: string;
  email: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
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
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  prefs?: Record<string, unknown>;
  stylePreferences?: Record<string, unknown>;
  preferredSizes?: Record<string, string | undefined>;
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

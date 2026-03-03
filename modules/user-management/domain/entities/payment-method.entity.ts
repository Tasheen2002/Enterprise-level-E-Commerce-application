import { UserId } from "../value-objects/user-id.vo";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../errors/user-management.errors";

export class PaymentMethod {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private type: PaymentMethodType,
    private brand: string | null,
    private last4: string | null,
    private expMonth: number | null,
    private expYear: number | null,
    private billingAddressId: string | null,
    private providerRef: string | null,
    private isDefault: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  // Factory methods
  static create(data: CreatePaymentMethodData): PaymentMethod {
    const paymentMethodId = crypto.randomUUID();
    const userId = UserId.fromString(data.userId);
    const now = PaymentMethod.createTimestamp();

    const paymentMethod = new PaymentMethod(
      paymentMethodId,
      userId,
      data.type,
      data.brand || null,
      data.last4 || null,
      data.expMonth || null,
      data.expYear || null,
      data.billingAddressId || null,
      data.providerRef || null,
      data.isDefault || false,
      now,
      now,
    );

    paymentMethod.validate();
    return paymentMethod;
  }

  static reconstitute(data: PaymentMethodEntityData): PaymentMethod {
    const paymentMethod = new PaymentMethod(
      data.id,
      UserId.fromString(data.userId),
      data.type,
      data.brand,
      data.last4,
      data.expMonth,
      data.expYear,
      data.billingAddressId,
      data.providerRef,
      data.isDefault,
      data.createdAt,
      data.updatedAt,
    );

    paymentMethod.validate();
    return paymentMethod;
  }

  // Factory method from database row
  static fromDatabaseRow(row: PaymentMethodRow): PaymentMethod {
    const paymentMethod = new PaymentMethod(
      row.payment_method_id,
      UserId.fromString(row.user_id),
      PaymentMethodType.fromString(row.type),
      row.brand,
      row.last4,
      row.exp_month,
      row.exp_year,
      row.billing_address_id,
      row.provider_ref,
      row.is_default,
      row.created_at,
      row.updated_at,
    );

    paymentMethod.validate();
    return paymentMethod;
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getUserId(): UserId {
    return this.userId;
  }
  getType(): PaymentMethodType {
    return this.type;
  }
  getBrand(): string | null {
    return this.brand;
  }
  getLast4(): string | null {
    return this.last4;
  }
  getExpMonth(): number | null {
    return this.expMonth;
  }
  getExpYear(): number | null {
    return this.expYear;
  }
  getBillingAddressId(): string | null {
    return this.billingAddressId;
  }
  getProviderRef(): string | null {
    return this.providerRef;
  }
  getIsDefault(): boolean {
    return this.isDefault;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  updateExpiry(month: number, year: number): void {
    if (this.expMonth === month && this.expYear === year) {
      return; // No change needed
    }

    if (month < 1 || month > 12) {
      throw new DomainValidationError("Invalid expiry month");
    }

    if (year < new Date().getFullYear()) {
      throw new DomainValidationError("Expiry year cannot be in the past");
    }

    this.expMonth = month;
    this.expYear = year;
    this.touch();
  }

  updateBillingAddress(addressId: string | null): void {
    if (this.billingAddressId === addressId) {
      return; // No change needed
    }

    this.billingAddressId = addressId;
    this.touch();
  }

  updateProviderRef(providerRef: string | null): void {
    if (this.providerRef === providerRef) {
      return; // No change needed
    }

    this.providerRef = providerRef;
    this.touch();
  }

  setAsDefault(): void {
    if (this.isDefault) {
      return; // Already default
    }

    this.isDefault = true;
    this.touch();
  }

  removeAsDefault(): void {
    if (!this.isDefault) {
      return; // Already not default
    }

    this.isDefault = false;
    this.touch();
  }

  // Validation methods
  isExpired(): boolean {
    if (!this.expMonth || !this.expYear) {
      return false; // No expiry date set
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

    if (this.expYear < currentYear) {
      return true;
    }

    if (this.expYear === currentYear && this.expMonth < currentMonth) {
      return true;
    }

    return false;
  }

  isExpiringThisMonth(): boolean {
    if (!this.expMonth || !this.expYear) {
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return this.expYear === currentYear && this.expMonth === currentMonth;
  }

  isExpiringSoon(monthsAhead: number = 3): boolean {
    if (!this.expMonth || !this.expYear) {
      return false;
    }

    const now = new Date();
    const futureDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthsAhead,
      now.getDate(),
    );
    const futureYear = futureDate.getFullYear();
    const futureMonth = futureDate.getMonth() + 1;

    if (this.expYear < futureYear) {
      return true;
    }

    if (this.expYear === futureYear && this.expMonth <= futureMonth) {
      return true;
    }

    return false;
  }

  canBeUsedForPayment(): boolean {
    return !this.isExpired();
  }

  belongsToUser(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  canBeDeleted(): boolean {
    // Business rule: Can always delete payment methods
    // The application should handle setting a new default if needed
    return true;
  }

  requiresBillingAddress(): boolean {
    return this.type === PaymentMethodType.CARD;
  }

  // Validation methods
  validate(): void {
    // Validate type matches database constraints
    if (!PaymentMethodType.getAllValues().includes(this.type)) {
      throw new InvalidOperationError(
        `Invalid payment method type: ${this.type}`,
      );
    }

    // Validate last4 format if present
    if (this.last4 && !/^\d{4}$/.test(this.last4)) {
      throw new DomainValidationError("last4 must be exactly 4 digits");
    }

    // Validate expiry month if present
    if (this.expMonth && (this.expMonth < 1 || this.expMonth > 12)) {
      throw new DomainValidationError("Expiry month must be between 1 and 12");
    }

    // Validate expiry year if present
    if (this.expYear && this.expYear < 1900) {
      throw new DomainValidationError("Expiry year must be a valid year");
    }

    // Validate card-specific fields
    if (this.type === PaymentMethodType.CARD) {
      if (!this.last4) {
        throw new DomainValidationError(
          "Card payment methods must have last4 digits",
        );
      }
      if (!this.expMonth || !this.expYear) {
        throw new DomainValidationError(
          "Card payment methods must have expiry date",
        );
      }
    }
  }

  // Display methods
  getDisplayName(): string {
    if (this.type === PaymentMethodType.CARD && this.last4) {
      const brandDisplay = this.brand ? `${this.brand} ` : "";
      return `${brandDisplay}****${this.last4}`;
    }

    return this.type
      .toString()
      .replace("_", " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  getExpiryDisplay(): string {
    if (!this.expMonth || !this.expYear) {
      return "";
    }

    const month = this.expMonth.toString().padStart(2, "0");
    const year = this.expYear.toString().slice(-2);
    return `${month}/${year}`;
  }

  // Internal methods
  private touch(): void {
    this.updatedAt = PaymentMethod.createTimestamp();
  }

  // Utility method for consistent date handling
  private static createTimestamp(): Date {
    return new Date();
  }

  // Database-compatible persistence method
  toDatabaseRow(): PaymentMethodRow {
    return {
      payment_method_id: this.id,
      user_id: this.userId.getValue(),
      type: this.type.toString(),
      brand: this.brand,
      last4: this.last4,
      exp_month: this.expMonth,
      exp_year: this.expYear,
      billing_address_id: this.billingAddressId,
      provider_ref: this.providerRef,
      is_default: this.isDefault,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  // Convert to data for persistence
  toData(): PaymentMethodEntityData {
    return {
      id: this.id,
      userId: this.userId.getValue(),
      type: this.type,
      brand: this.brand,
      last4: this.last4,
      expMonth: this.expMonth,
      expYear: this.expYear,
      billingAddressId: this.billingAddressId,
      providerRef: this.providerRef,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  equals(other: PaymentMethod): boolean {
    return this.id === other.id;
  }
}

// Supporting types and enums
export enum PaymentMethodType {
  CARD = "card",
  WALLET = "wallet",
  BANK = "bank",
  COD = "cod",
  GIFT_CARD = "gift_card",
}

export namespace PaymentMethodType {
  export function fromString(type: string): PaymentMethodType {
    if (!type || typeof type !== "string") {
      throw new DomainValidationError(
        "Payment method type must be a non-empty string",
      );
    }

    switch (type.toLowerCase()) {
      case "card":
        return PaymentMethodType.CARD;
      case "wallet":
        return PaymentMethodType.WALLET;
      case "bank":
        return PaymentMethodType.BANK;
      case "cod":
        return PaymentMethodType.COD;
      case "gift_card":
        return PaymentMethodType.GIFT_CARD;
      default:
        throw new DomainValidationError(`Invalid payment method type: ${type}`);
    }
  }

  export function toString(type: PaymentMethodType): string {
    return type;
  }

  export function getAllValues(): PaymentMethodType[] {
    return [
      PaymentMethodType.CARD,
      PaymentMethodType.WALLET,
      PaymentMethodType.BANK,
      PaymentMethodType.COD,
      PaymentMethodType.GIFT_CARD,
    ];
  }

  export function getDisplayName(type: PaymentMethodType): string {
    switch (type) {
      case PaymentMethodType.CARD:
        return "Credit/Debit Card";
      case PaymentMethodType.WALLET:
        return "Digital Wallet";
      case PaymentMethodType.BANK:
        return "Bank Transfer";
      case PaymentMethodType.COD:
        return "Cash on Delivery";
      case PaymentMethodType.GIFT_CARD:
        return "Gift Card";
    }
  }
}

export interface CreatePaymentMethodData {
  userId: string;
  type: PaymentMethodType;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  providerRef?: string;
  isDefault?: boolean;
}

export interface PaymentMethodEntityData {
  id: string;
  userId: string;
  type: PaymentMethodType;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  billingAddressId: string | null;
  providerRef: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Database row interface matching PostgreSQL schema
export interface PaymentMethodRow {
  payment_method_id: string;
  user_id: string;
  type: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  billing_address_id: string | null;
  provider_ref: string | null; // vaulted token / PSP reference
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

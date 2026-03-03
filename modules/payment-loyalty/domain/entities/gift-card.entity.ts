import { GiftCardId } from "../value-objects/gift-card-id.vo";
import { GiftCardStatus } from "../value-objects/gift-card-status.vo";
import { Money } from "../value-objects/money.vo";
import {
  GiftCardRedemptionError,
  GiftCardRefundError,
  GiftCardCancellationError,
  GiftCardExpiryError,
} from "../errors";

export interface CreateGiftCardData {
  code: string;
  initialAmount: Money;
  expiresAt?: Date;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

export class GiftCard {
  private constructor(
    private readonly _id: GiftCardId,
    private readonly _code: string,
    private _balance: Money,
    private readonly _initialAmount: Money,
    private _status: GiftCardStatus,
    private readonly _expiresAt: Date | undefined,
    private readonly _recipientEmail: string | undefined,
    private readonly _recipientName: string | undefined,
    private readonly _message: string | undefined,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(data: CreateGiftCardData): GiftCard {
    const id = GiftCardId.create();
    const now = new Date();

    return new GiftCard(
      id,
      data.code,
      data.initialAmount, // balance starts equal to initial amount
      data.initialAmount,
      GiftCardStatus.active(),
      data.expiresAt,
      data.recipientEmail,
      data.recipientName,
      data.message,
      now,
      now,
    );
  }

  static reconstitute(data: {
    id: GiftCardId;
    code: string;
    balance: Money;
    initialAmount: Money;
    status: GiftCardStatus;
    expiresAt?: Date;
    recipientEmail?: string;
    recipientName?: string;
    message?: string;
    createdAt: Date;
    updatedAt: Date;
  }): GiftCard {
    return new GiftCard(
      data.id,
      data.code,
      data.balance,
      data.initialAmount,
      data.status,
      data.expiresAt,
      data.recipientEmail,
      data.recipientName,
      data.message,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Getters
  get id(): GiftCardId {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get balance(): Money {
    return this._balance;
  }

  get initialAmount(): Money {
    return this._initialAmount;
  }

  get status(): GiftCardStatus {
    return this._status;
  }

  get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  get recipientEmail(): string | undefined {
    return this._recipientEmail;
  }

  get recipientName(): string | undefined {
    return this._recipientName;
  }

  get message(): string | undefined {
    return this._message;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  isActive(): boolean {
    return this._status.isActive();
  }

  isExpired(): boolean {
    if (!this._expiresAt) return false;
    return this._expiresAt < new Date();
  }

  canRedeem(amount: Money): boolean {
    if (!this.isActive()) return false;
    if (this.isExpired()) return false;
    return this._balance.getAmount() >= amount.getAmount();
  }

  redeem(amount: Money): void {
    if (!this.canRedeem(amount)) {
      throw new GiftCardRedemptionError("card is inactive, expired, or has insufficient balance");
    }

    this._balance = this._balance.subtract(amount);

    if (this._balance.isZero()) {
      this._status = GiftCardStatus.redeemed();
    }

    this._updatedAt = new Date();
  }

  refund(amount: Money): void {
    if (!this._status.isActive() && !this._status.isRedeemed()) {
      throw new GiftCardRefundError("card must be active or redeemed");
    }

    this._balance = this._balance.add(amount);

    if (this._status.isRedeemed()) {
      this._status = GiftCardStatus.active();
    }

    this._updatedAt = new Date();
  }

  cancel(): void {
    if (this._status.isCancelled()) {
      throw new GiftCardCancellationError("gift card is already cancelled");
    }
    this._status = GiftCardStatus.cancelled();
    this._updatedAt = new Date();
  }

  expire(): void {
    if (!this.isExpired()) {
      throw new GiftCardExpiryError("expiry date has not passed");
    }
    this._status = GiftCardStatus.expired();
    this._updatedAt = new Date();
  }
}

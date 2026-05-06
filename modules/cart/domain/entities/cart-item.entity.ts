import { randomUUID } from "crypto";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { Quantity } from "../value-objects/quantity.vo";
import { AppliedPromos, AppliedPromoData } from "../value-objects/applied-promos.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

// ============================================================================
// Props & Data Interfaces
// ============================================================================

export interface CartItemProps {
  id: string;
  cartId: string;
  variantId: VariantId;
  quantity: Quantity;
  unitPriceSnapshot: number;
  appliedPromos: AppliedPromos;
  isGift: boolean;
  giftMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCartItemData {
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  appliedPromos?: AppliedPromoData[];
  isGift?: boolean;
  giftMessage?: string;
}

export interface CartItemEntityData {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPriceSnapshot: number;
  appliedPromos: AppliedPromoData[];
  isGift: boolean;
  giftMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTO
// ============================================================================

export interface CartItemDTO {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPriceSnapshot: number;
  appliedPromos: AppliedPromoData[];
  isGift: boolean;
  giftMessage?: string;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Entity
// ============================================================================

export class CartItem {
  private constructor(private props: CartItemProps) {}

  // Factory methods
  static create(data: CreateCartItemData): CartItem {
    if (data.unitPrice < 0) {
      throw new DomainValidationError("Unit price cannot be negative");
    }
    if (data.isGift && (!data.giftMessage || data.giftMessage.trim().length === 0)) {
      throw new DomainValidationError("Gift message is required for gift items");
    }

    const now = new Date();
    return new CartItem({
      id: randomUUID(),
      cartId: data.cartId,
      variantId: VariantId.fromString(data.variantId),
      quantity: Quantity.fromNumber(data.quantity),
      unitPriceSnapshot: data.unitPrice,
      appliedPromos: AppliedPromos.create(data.appliedPromos || []),
      isGift: data.isGift || false,
      giftMessage: data.giftMessage,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(data: CartItemEntityData): CartItem {
    return new CartItem({
      id: data.id,
      cartId: data.cartId,
      variantId: VariantId.fromString(data.variantId),
      quantity: Quantity.fromNumber(data.quantity),
      unitPriceSnapshot: data.unitPriceSnapshot,
      appliedPromos: AppliedPromos.fromPersistence(data.appliedPromos),
      isGift: data.isGift,
      giftMessage: data.giftMessage,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get cartId(): string {
    return this.props.cartId;
  }

  get variantId(): VariantId {
    return this.props.variantId;
  }

  get quantity(): Quantity {
    return this.props.quantity;
  }

  get unitPrice(): number {
    return this.props.unitPriceSnapshot;
  }

  get appliedPromos(): AppliedPromos {
    return this.props.appliedPromos;
  }

  get isGift(): boolean {
    return this.props.isGift;
  }

  get giftMessage(): string | undefined {
    return this.props.giftMessage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateQuantity(newQuantity: number): void {
    this.props.quantity = Quantity.fromNumber(newQuantity);
    this.props.updatedAt = new Date();
  }

  incrementQuantity(amount: number = 1): void {
    this.updateQuantity(this.props.quantity.getValue() + amount);
  }

  decrementQuantity(amount: number = 1): void {
    this.updateQuantity(this.props.quantity.getValue() - amount);
  }

  addPromo(promo: AppliedPromoData): void {
    this.props.appliedPromos = this.props.appliedPromos.addPromo(promo);
    this.props.updatedAt = new Date();
  }

  removePromo(promoId: string): void {
    this.props.appliedPromos = this.props.appliedPromos.removePromo(promoId);
    this.props.updatedAt = new Date();
  }

  clearPromos(): void {
    this.props.appliedPromos = AppliedPromos.empty();
    this.props.updatedAt = new Date();
  }

  markAsGift(giftMessage: string): void {
    if (!giftMessage || giftMessage.trim().length === 0) {
      throw new DomainValidationError("Gift message is required when marking item as gift");
    }
    this.props.isGift = true;
    this.props.giftMessage = giftMessage.trim();
    this.props.updatedAt = new Date();
  }

  unmarkAsGift(): void {
    this.props.isGift = false;
    this.props.giftMessage = undefined;
    this.props.updatedAt = new Date();
  }

  updateGiftMessage(giftMessage: string): void {
    if (!this.props.isGift) {
      throw new InvalidOperationError("Cannot update gift message for non-gift items");
    }
    if (!giftMessage || giftMessage.trim().length === 0) {
      throw new DomainValidationError("Gift message cannot be empty");
    }
    this.props.giftMessage = giftMessage.trim();
    this.props.updatedAt = new Date();
  }

  // Price calculations
  get subtotal(): number {
    return this.props.unitPriceSnapshot * this.props.quantity.getValue();
  }

  get discountAmount(): number {
    const sub = this.subtotal;
    const percentageDiscount = this.props.appliedPromos.getTotalPercentageDiscount();
    const fixedDiscount = this.props.appliedPromos.getTotalFixedDiscount();
    const percentageDiscountAmount = (sub * percentageDiscount) / 100;
    const totalDiscount = Math.min(percentageDiscountAmount + fixedDiscount, sub);
    return Math.max(0, totalDiscount);
  }

  get totalPrice(): number {
    return Math.max(0, this.subtotal - this.discountAmount);
  }

  get hasPromosApplied(): boolean {
    return !this.props.appliedPromos.isEmpty();
  }

  get hasFreeShipping(): boolean {
    return this.props.appliedPromos.hasFreeShipping();
  }

  equals(other: CartItem): boolean {
    return this.props.id === other.props.id;
  }

  toSnapshot(): CartItemEntityData {
    return {
      id: this.props.id,
      cartId: this.props.cartId,
      variantId: this.props.variantId.getValue(),
      quantity: this.props.quantity.getValue(),
      unitPriceSnapshot: this.props.unitPriceSnapshot,
      appliedPromos: this.props.appliedPromos.getValue(),
      isGift: this.props.isGift,
      giftMessage: this.props.giftMessage,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  static toDTO(item: CartItem): CartItemDTO {
    return {
      id: item.props.id,
      cartId: item.props.cartId,
      variantId: item.props.variantId.getValue(),
      quantity: item.props.quantity.getValue(),
      unitPriceSnapshot: item.props.unitPriceSnapshot,
      appliedPromos: item.props.appliedPromos.getValue(),
      isGift: item.props.isGift,
      giftMessage: item.props.giftMessage,
      subtotal: item.subtotal,
      discountAmount: item.discountAmount,
      totalPrice: item.totalPrice,
      createdAt: item.props.createdAt.toISOString(),
      updatedAt: item.props.updatedAt.toISOString(),
    };
  }
}

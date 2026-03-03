import { VariantId } from "../value-objects/variant-id.vo";
import { Quantity } from "../value-objects/quantity.vo";
import { AppliedPromos, PromoData } from "../value-objects/applied-promos.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

export interface CreateCartItemData {
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  appliedPromos?: PromoData[];
  isGift?: boolean;
  giftMessage?: string;
}

export interface CartItemEntityData {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPriceSnapshot: number;
  appliedPromos: PromoData[];
  isGift: boolean;
  giftMessage?: string;
}

export class CartItem {
  private constructor(
    private readonly id: string,
    private readonly cartId: string,
    private readonly variantId: VariantId,
    private quantity: Quantity,
    private readonly unitPriceSnapshot: number,
    private appliedPromos: AppliedPromos,
    private isGift: boolean,
    private giftMessage?: string,
  ) {}

  // Factory methods
  static create(data: CreateCartItemData): CartItem {
    const cartItemId = crypto.randomUUID();
    const variantId = VariantId.fromString(data.variantId);
    const quantity = Quantity.fromNumber(data.quantity);
    const appliedPromos = AppliedPromos.fromArray(data.appliedPromos || []);

    if (data.unitPrice < 0) {
      throw new DomainValidationError("Unit price cannot be negative");
    }

    if (
      data.isGift &&
      (!data.giftMessage || data.giftMessage.trim().length === 0)
    ) {
      throw new DomainValidationError("Gift message is required for gift items");
    }

    return new CartItem(
      cartItemId,
      data.cartId,
      variantId,
      quantity,
      data.unitPrice,
      appliedPromos,
      data.isGift || false,
      data.giftMessage,
    );
  }

  static reconstitute(data: CartItemEntityData): CartItem {
    const variantId = VariantId.fromString(data.variantId);
    const quantity = Quantity.fromNumber(data.quantity);
    const appliedPromos = AppliedPromos.fromArray(data.appliedPromos);

    return new CartItem(
      data.id,
      data.cartId,
      variantId,
      quantity,
      data.unitPriceSnapshot,
      appliedPromos,
      data.isGift,
      data.giftMessage,
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getCartId(): string {
    return this.cartId;
  }

  getVariantId(): VariantId {
    return this.variantId;
  }

  getQuantity(): Quantity {
    return this.quantity;
  }

  getUnitPrice(): number {
    return this.unitPriceSnapshot;
  }

  getAppliedPromos(): AppliedPromos {
    return this.appliedPromos;
  }

  isGiftItem(): boolean {
    return this.isGift;
  }

  getGiftMessage(): string | undefined {
    return this.giftMessage;
  }

  // Business methods
  updateQuantity(newQuantity: number): void {
    this.quantity = Quantity.fromNumber(newQuantity);
  }

  incrementQuantity(amount: number = 1): void {
    const newQuantity = this.quantity.getValue() + amount;
    this.updateQuantity(newQuantity);
  }

  decrementQuantity(amount: number = 1): void {
    const newQuantity = this.quantity.getValue() - amount;
    this.updateQuantity(newQuantity);
  }

  addPromo(promo: PromoData): void {
    this.appliedPromos = this.appliedPromos.addPromo(promo);
  }

  removePromo(promoId: string): void {
    this.appliedPromos = this.appliedPromos.removePromo(promoId);
  }

  clearPromos(): void {
    this.appliedPromos = AppliedPromos.empty();
  }

  markAsGift(giftMessage: string): void {
    if (!giftMessage || giftMessage.trim().length === 0) {
      throw new DomainValidationError("Gift message is required when marking item as gift");
    }
    this.isGift = true;
    this.giftMessage = giftMessage.trim();
  }

  unmarkAsGift(): void {
    this.isGift = false;
    this.giftMessage = undefined;
  }

  updateGiftMessage(giftMessage: string): void {
    if (!this.isGift) {
      throw new InvalidOperationError("Cannot update gift message for non-gift items");
    }
    if (!giftMessage || giftMessage.trim().length === 0) {
      throw new DomainValidationError("Gift message cannot be empty");
    }
    this.giftMessage = giftMessage.trim();
  }

  // Price calculations
  getSubtotal(): number {
    return this.unitPriceSnapshot * this.quantity.getValue();
  }

  getDiscountAmount(): number {
    const subtotal = this.getSubtotal();
    const percentageDiscount = this.appliedPromos.getTotalPercentageDiscount();
    const fixedDiscount = this.appliedPromos.getTotalFixedDiscount();

    const percentageDiscountAmount = (subtotal * percentageDiscount) / 100;
    const totalDiscount = Math.min(
      percentageDiscountAmount + fixedDiscount,
      subtotal,
    );

    return Math.max(0, totalDiscount);
  }

  getTotalPrice(): number {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    return Math.max(0, subtotal - discount);
  }

  // Utility methods
  hasPromosApplied(): boolean {
    return !this.appliedPromos.isEmpty();
  }

  hasFreeShipping(): boolean {
    return this.appliedPromos.hasFreeShipping();
  }

  equals(other: CartItem): boolean {
    return (
      this.id === other.id &&
      this.cartId === other.cartId &&
      this.variantId.equals(other.variantId)
    );
  }

  toSnapshot(): CartItemEntityData {
    return {
      id: this.id,
      cartId: this.cartId,
      variantId: this.variantId.getValue(),
      quantity: this.quantity.getValue(),
      unitPriceSnapshot: this.unitPriceSnapshot,
      appliedPromos: this.appliedPromos.getValue(),
      isGift: this.isGift,
      giftMessage: this.giftMessage,
    };
  }
}

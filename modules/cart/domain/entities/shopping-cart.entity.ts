import { CartId } from "../value-objects/cart-id.vo";
import { UserId } from "../../../user-management/domain/value-objects/user-id.vo";
import { GuestToken } from "../value-objects/guest-token.vo";
import { Currency } from "../value-objects/currency.vo";
import {
  CartItem,
  CreateCartItemData,
  CartItemEntityData,
} from "./cart-item.entity";
import { VariantId } from "../value-objects/variant-id.vo";
import {
  DomainValidationError,
  CartItemNotFoundError,
  InvalidOperationError,
} from "../errors";
import { CART_RESERVATION_DEFAULT_EXTENSION_HOURS } from "../constants";

export interface CreateShoppingCartData {
  userId?: string;
  guestToken?: string;
  currency: string;
  reservationExpiresAt?: Date;
}

export interface ShoppingCartEntityData {
  cartId: string;
  userId?: string;
  guestToken?: string;
  currency: string;
  reservationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: CartItemEntityData[];
}

export class ShoppingCart {
  private constructor(
    private readonly cartId: CartId,
    private readonly userId: UserId | null,
    private readonly guestToken: GuestToken | null,
    private currency: Currency,
    private items: CartItem[],
    private reservationExpiresAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    // Business rule: Cart must belong to either user or guest, not both
    if (userId && guestToken) {
      throw new DomainValidationError("Cart cannot belong to both user and guest");
    }
    if (!userId && !guestToken) {
      throw new DomainValidationError("Cart must belong to either user or guest");
    }
  }

  // Factory methods
  static createForUser(
    data: CreateShoppingCartData & { userId: string },
  ): ShoppingCart {
    const cartId = CartId.create();
    const userId = UserId.fromString(data.userId);
    const currency = Currency.fromString(data.currency);
    const now = new Date();

    return new ShoppingCart(
      cartId,
      userId,
      null,
      currency,
      [],
      data.reservationExpiresAt || null,
      now,
      now,
    );
  }

  static createForGuest(
    data: CreateShoppingCartData & { guestToken: string },
  ): ShoppingCart {
    const cartId = CartId.create();
    const guestToken = GuestToken.fromString(data.guestToken);
    const currency = Currency.fromString(data.currency);
    const now = new Date();

    return new ShoppingCart(
      cartId,
      null,
      guestToken,
      currency,
      [],
      data.reservationExpiresAt || null,
      now,
      now,
    );
  }

  static reconstitute(data: ShoppingCartEntityData): ShoppingCart {
    const cartId = CartId.fromString(data.cartId);
    const userId = data.userId ? UserId.fromString(data.userId) : null;
    const guestToken = data.guestToken
      ? GuestToken.fromString(data.guestToken)
      : null;
    const currency = Currency.fromString(data.currency);
    const items = data.items.map((itemData) => CartItem.reconstitute(itemData));

    return new ShoppingCart(
      cartId,
      userId,
      guestToken,
      currency,
      items,
      data.reservationExpiresAt || null,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Getters
  getCartId(): CartId {
    return this.cartId;
  }

  getUserId(): UserId | null {
    return this.userId;
  }

  getGuestToken(): GuestToken | null {
    return this.guestToken;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getItems(): CartItem[] {
    return [...this.items];
  }

  getReservationExpiresAt(): Date | null {
    return this.reservationExpiresAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Cart type identification
  isUserCart(): boolean {
    return this.userId !== null;
  }

  isGuestCart(): boolean {
    return this.guestToken !== null;
  }

  // Cart state methods
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  getItemCount(): number {
    return this.items.reduce(
      (total, item) => total + item.getQuantity().getValue(),
      0,
    );
  }

  getUniqueItemCount(): number {
    return this.items.length;
  }

  // Item management
  addItem(itemData: Omit<CreateCartItemData, "cartId">): void {
    const createData: CreateCartItemData = {
      ...itemData,
      cartId: this.cartId.getValue(),
    };

    const existingItem = this.findItemByVariantId(itemData.variantId);

    if (existingItem) {
      // Update existing item quantity
      const newQuantity =
        existingItem.getQuantity().getValue() + itemData.quantity;
      existingItem.updateQuantity(newQuantity);
    } else {
      // Add new item
      const newItem = CartItem.create(createData);
      this.items.push(newItem);
    }

    this.touch();
  }

  updateItemQuantity(variantId: string, quantity: number): void {
    const item = this.findItemByVariantId(variantId);
    if (!item) {
      throw new CartItemNotFoundError(variantId);
    }

    if (quantity <= 0) {
      this.removeItem(variantId);
    } else {
      item.updateQuantity(quantity);
      this.touch();
    }
  }

  removeItem(variantId: string): void {
    const itemIndex = this.items.findIndex(
      (item) => item.getVariantId().getValue() === variantId,
    );

    if (itemIndex === -1) {
      throw new CartItemNotFoundError(variantId);
    }

    this.items.splice(itemIndex, 1);
    this.touch();
  }

  clearItems(): void {
    this.items = [];
    this.touch();
  }

  // Item lookup
  findItemByVariantId(variantId: string): CartItem | undefined {
    return this.items.find(
      (item) => item.getVariantId().getValue() === variantId,
    );
  }

  hasItem(variantId: string): boolean {
    return this.findItemByVariantId(variantId) !== undefined;
  }

  // Price calculations
  getSubtotal(): number {
    return this.items.reduce((total, item) => total + item.getSubtotal(), 0);
  }

  getTotalDiscount(): number {
    return this.items.reduce(
      (total, item) => total + item.getDiscountAmount(),
      0,
    );
  }

  getTotal(): number {
    return this.items.reduce((total, item) => total + item.getTotalPrice(), 0);
  }

  // Shipping calculations
  hasItemsWithFreeShipping(): boolean {
    return this.items.some((item) => item.hasFreeShipping());
  }

  getItemsRequiringShipping(): CartItem[] {
    return this.items.filter((item) => !item.hasFreeShipping());
  }

  // Gift functionality
  getGiftItems(): CartItem[] {
    return this.items.filter((item) => item.isGiftItem());
  }

  hasGiftItems(): boolean {
    return this.getGiftItems().length > 0;
  }

  // Currency management
  updateCurrency(newCurrency: string): void {
    this.currency = Currency.fromString(newCurrency);
    this.touch();
  }

  // Reservation management
  updateReservationExpiry(expiresAt: Date | null): void {
    this.reservationExpiresAt = expiresAt;
    this.touch();
  }

  isReservationExpired(): boolean {
    if (!this.reservationExpiresAt) {
      return false;
    }
    return new Date() > this.reservationExpiresAt;
  }

  extendReservation(hours: number = CART_RESERVATION_DEFAULT_EXTENSION_HOURS): void {
    const now = new Date();
    this.reservationExpiresAt = new Date(
      now.getTime() + hours * 60 * 60 * 1000,
    );
    this.touch();
  }

  // Cart ownership transfer (guest to user)
  transferToUser(userId: string): ShoppingCart {
    if (this.isUserCart()) {
      throw new InvalidOperationError("Cannot transfer user cart to another user");
    }

    const newUserId = UserId.fromString(userId);
    const transferredCart = new ShoppingCart(
      this.cartId,
      newUserId,
      null,
      this.currency,
      this.items,
      this.reservationExpiresAt,
      this.createdAt,
      new Date(),
    );

    return transferredCart;
  }

  // Merge carts (for guest-to-user scenarios)
  mergeWith(otherCart: ShoppingCart): void {
    if (!this.isUserCart()) {
      throw new InvalidOperationError("Can only merge into user cart");
    }

    for (const otherItem of otherCart.items) {
      const existingItem = this.findItemByVariantId(
        otherItem.getVariantId().getValue(),
      );

      if (existingItem) {
        // Merge quantities
        const combinedQuantity =
          existingItem.getQuantity().getValue() +
          otherItem.getQuantity().getValue();
        existingItem.updateQuantity(combinedQuantity);
      } else {
        // Add the item with new cart ID
        const itemData: CreateCartItemData = {
          cartId: this.cartId.getValue(),
          variantId: otherItem.getVariantId().getValue(),
          quantity: otherItem.getQuantity().getValue(),
          unitPrice: otherItem.getUnitPrice(),
          appliedPromos: otherItem.getAppliedPromos().getValue(),
          isGift: otherItem.isGiftItem(),
          giftMessage: otherItem.getGiftMessage(),
        };

        const newItem = CartItem.create(itemData);
        this.items.push(newItem);
      }
    }

    this.touch();
  }

  // Utility methods
  private touch(): void {
    this.updatedAt = new Date();
  }

  equals(other: ShoppingCart): boolean {
    return this.cartId.equals(other.cartId);
  }

  toSnapshot(): ShoppingCartEntityData {
    return {
      cartId: this.cartId.getValue(),
      userId: this.userId?.getValue(),
      guestToken: this.guestToken?.getValue(),
      currency: this.currency.getValue(),
      reservationExpiresAt: this.reservationExpiresAt || undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      items: this.items.map((item) => item.toSnapshot()),
    };
  }

  // Summary for API responses
  getSummary() {
    return {
      cartId: this.cartId.getValue(),
      isUserCart: this.isUserCart(),
      isGuestCart: this.isGuestCart(),
      currency: this.currency.getValue(),
      itemCount: this.getItemCount(),
      uniqueItemCount: this.getUniqueItemCount(),
      subtotal: this.getSubtotal(),
      totalDiscount: this.getTotalDiscount(),
      total: this.getTotal(),
      hasGiftItems: this.hasGiftItems(),
      hasFreeShipping: this.hasItemsWithFreeShipping(),
      isEmpty: this.isEmpty(),
      isReservationExpired: this.isReservationExpired(),
      reservationExpiresAt: this.reservationExpiresAt,
      updatedAt: this.updatedAt,
    };
  }
}

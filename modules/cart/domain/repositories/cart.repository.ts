import { ShoppingCart } from "../entities/shopping-cart.entity";
import { CartId } from "../value-objects/cart-id.vo";
import { GuestToken } from "../value-objects/guest-token.vo";
import { UserId } from "../../../user-management/domain/value-objects/user-id.vo";
import { Currency } from "../value-objects/currency.vo";

export interface CartRepository {
  save(cart: ShoppingCart): Promise<void>;
  findById(cartId: CartId): Promise<ShoppingCart | null>;
  update(cart: ShoppingCart): Promise<void>;
  delete(cartId: CartId): Promise<void>;
  findByUserId(userId: UserId): Promise<ShoppingCart | null>;
  findActiveCartByUserId(userId: UserId): Promise<ShoppingCart | null>;
  existsByUserId(userId: UserId): Promise<boolean>;
  findByGuestToken(guestToken: GuestToken): Promise<ShoppingCart | null>;
  findActiveCartByGuestToken(
    guestToken: GuestToken,
  ): Promise<ShoppingCart | null>;
  existsByGuestToken(guestToken: GuestToken): Promise<boolean>;
  createUserCart(userId: UserId, currency: Currency): Promise<ShoppingCart>;
  createGuestCart(
    guestToken: GuestToken,
    currency: Currency,
  ): Promise<ShoppingCart>;
  transferGuestCartToUser(
    guestToken: GuestToken,
    userId: UserId,
  ): Promise<ShoppingCart>;
  mergeGuestCartIntoUserCart(
    guestToken: GuestToken,
    userId: UserId,
  ): Promise<ShoppingCart>;
  findEmptyCarts(olderThanDays?: number): Promise<ShoppingCart[]>;
  findExpiredReservationCarts(): Promise<ShoppingCart[]>;
  findCartsByCurrency(
    currency: Currency,
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]>;
  findRecentlyUpdatedCarts(
    hours: number,
    limit?: number,
  ): Promise<ShoppingCart[]>;
  countItemsInCart(cartId: CartId): Promise<number>;
  getCartTotal(cartId: CartId): Promise<number>;
  hasItems(cartId: CartId): Promise<boolean>;
  getCartAge(cartId: CartId): Promise<number>; // Returns age in hours
  findByIds(cartIds: CartId[]): Promise<ShoppingCart[]>;
  deleteEmptyCarts(olderThanDays: number): Promise<number>;
  deleteExpiredGuestCarts(olderThanDays: number): Promise<number>;
  updateExpiredReservations(): Promise<number>;
  getCartStatistics(): Promise<{
    totalCarts: number;
    userCarts: number;
    guestCarts: number;
    emptyCarts: number;
    averageItemsPerCart: number;
    averageCartValue: number;
  }>;

  getCartsByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]>;
  findAbandonedCarts(
    abandonedAfterHours: number,
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]>;

  findCartsWithGiftItems(
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]>;
  findCartsWithPromotions(
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]>;
  findCartsAboveValue(
    minValue: number,
    currency: Currency,
  ): Promise<ShoppingCart[]>;
  cleanupExpiredGuestCarts(): Promise<number>;
  cleanupAbandonedCarts(abandonedAfterDays: number): Promise<number>;
  archiveOldCarts(olderThanDays: number): Promise<number>;
  findCartsWithExpiredReservations(): Promise<ShoppingCart[]>;
  updateCartReservationExpiry(
    cartId: CartId,
    expiresAt: Date | null,
  ): Promise<void>;
  extendCartReservations(
    cartId: CartId,
    additionalHours: number,
  ): Promise<void>;
  searchCarts(criteria: {
    userId?: string;
    guestToken?: string;
    currency?: string;
    minValue?: number;
    maxValue?: number;
    hasGiftItems?: boolean;
    isEmpty?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ShoppingCart[]>;
  validateCartOwnership(
    cartId: CartId,
    userId?: UserId,
    guestToken?: GuestToken,
  ): Promise<boolean>;
  isCartAccessible(
    cartId: CartId,
    userId?: UserId,
    guestToken?: GuestToken,
  ): Promise<boolean>;
  getCartSummary(cartId: CartId): Promise<{
    cartId: string;
    itemCount: number;
    uniqueItemCount: number;
    subtotal: number;
    totalDiscount: number;
    total: number;
    currency: string;
    hasGiftItems: boolean;
    isExpired: boolean;
    updatedAt: Date;
  } | null>;
  saveWithTransaction(
    cart: ShoppingCart,
    transactionContext?: any,
  ): Promise<void>;
  deleteWithTransaction(
    cartId: CartId,
    transactionContext?: any,
  ): Promise<void>;
  updateEmail(cartId: CartId, email: string): Promise<void>;
  updateShippingInfo(
    cartId: CartId,
    data: {
      shippingMethod?: string;
      shippingOption?: string;
      isGift?: boolean;
    },
  ): Promise<void>;
  updateAddresses(
    cartId: CartId,
    data: {
      shippingFirstName?: string;
      shippingLastName?: string;
      shippingAddress1?: string;
      shippingAddress2?: string;
      shippingCity?: string;
      shippingProvince?: string;
      shippingPostalCode?: string;
      shippingCountryCode?: string;
      shippingPhone?: string;
      billingFirstName?: string;
      billingLastName?: string;
      billingAddress1?: string;
      billingAddress2?: string;
      billingCity?: string;
      billingProvince?: string;
      billingPostalCode?: string;
      billingCountryCode?: string;
      billingPhone?: string;
      sameAddressForBilling?: boolean;
    },
  ): Promise<void>;
  getCartWithCheckoutInfo(cartId: string): Promise<any>;
}

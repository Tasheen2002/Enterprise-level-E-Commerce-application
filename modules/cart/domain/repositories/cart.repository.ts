import { ShoppingCart } from "../entities/shopping-cart.entity";
import { CartId } from "../value-objects/cart-id.vo";
import { GuestToken } from "../value-objects/guest-token.vo";
import { CartOwnerId } from "../value-objects/cart-owner-id.vo";

export interface ICartRepository {
  // ── Aggregate persistence ──────────────────────────────────────────
  save(cart: ShoppingCart): Promise<void>;
  findById(cartId: CartId): Promise<ShoppingCart | null>;
  delete(cartId: CartId): Promise<void>;

  // ── Alternate-key lookups ──────────────────────────────────────────
  findActiveCartByCartOwnerId(userId: CartOwnerId): Promise<ShoppingCart | null>;
  findActiveCartByGuestToken(guestToken: GuestToken): Promise<ShoppingCart | null>;
  findByGuestToken(guestToken: GuestToken): Promise<ShoppingCart | null>;

  // ── Read projection ─────────────────────────────────────────────────
  getCartWithCheckoutInfo(cartId: CartId): Promise<CartWithCheckoutInfo | null>;

  // ── Operational ─────────────────────────────────────────────────────
  getCartStatistics(): Promise<CartStatistics>;
  cleanupExpiredGuestCarts(): Promise<number>;
}

export interface CartStatistics {
  totalCarts: number;
  userCarts: number;
  guestCarts: number;
  emptyCarts: number;
  averageItemsPerCart: number;
  averageCartValue: number;
}

export interface CartWithCheckoutInfo {
  id: string;
  email?: string | null;
  shippingMethod?: string | null;
  shippingOption?: string | null;
  isGift?: boolean | null;
  shippingFirstName?: string | null;
  shippingLastName?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  shippingPostalCode?: string | null;
  shippingCountryCode?: string | null;
  shippingPhone?: string | null;
  billingFirstName?: string | null;
  billingLastName?: string | null;
  billingAddress1?: string | null;
  billingAddress2?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  billingPostalCode?: string | null;
  billingCountryCode?: string | null;
  billingPhone?: string | null;
  sameAddressForBilling?: boolean | null;
}

export interface CartAddressData {
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
}

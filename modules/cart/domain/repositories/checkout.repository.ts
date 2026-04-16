import { Checkout } from "../entities/checkout.entity";
import { CheckoutId } from "../value-objects/checkout-id.vo";
import { CartId } from "../value-objects/cart-id.vo";
import { CartOwnerId } from "../value-objects/cart-owner-id.vo";
import { GuestToken } from "../value-objects/guest-token.vo";

export interface ICheckoutRepository {
  save(checkout: Checkout): Promise<void>;
  findById(checkoutId: CheckoutId): Promise<Checkout | null>;
  findByCartId(cartId: CartId): Promise<Checkout | null>;
  delete(checkoutId: CheckoutId): Promise<void>;

  findByCartOwnerId(userId: CartOwnerId): Promise<Checkout[]>;
  findByGuestToken(guestToken: GuestToken): Promise<Checkout[]>;
  findPendingCheckouts(): Promise<Checkout[]>;
  findExpiredCheckouts(): Promise<Checkout[]>;

  markAsCompleted(checkoutId: CheckoutId, completedAt: Date): Promise<void>;
  markAsExpired(checkoutId: CheckoutId): Promise<void>;
  markAsCancelled(checkoutId: CheckoutId): Promise<void>;

  cleanupExpiredCheckouts(): Promise<number>;
}
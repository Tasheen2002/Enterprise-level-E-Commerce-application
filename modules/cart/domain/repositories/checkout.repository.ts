import { Checkout } from "../entities/checkout.entity";
import { CheckoutId } from "../value-objects/checkout-id.vo";
import { CartId } from "../value-objects/cart-id.vo";
import { UserId } from "../../../user-management/domain/value-objects/user-id.vo";
import { GuestToken } from "../value-objects/guest-token.vo";

export interface CheckoutRepository {
  save(checkout: Checkout): Promise<void>;
  findById(checkoutId: CheckoutId): Promise<Checkout | null>;
  findByCartId(cartId: CartId): Promise<Checkout | null>;
  update(checkout: Checkout): Promise<void>;
  delete(checkoutId: CheckoutId): Promise<void>;

  findByUserId(userId: UserId): Promise<Checkout[]>;
  findByGuestToken(guestToken: GuestToken): Promise<Checkout[]>;
  findPendingCheckouts(): Promise<Checkout[]>;
  findExpiredCheckouts(): Promise<Checkout[]>;

  markAsCompleted(checkoutId: CheckoutId, completedAt: Date): Promise<void>;
  markAsExpired(checkoutId: CheckoutId): Promise<void>;
  markAsCancelled(checkoutId: CheckoutId): Promise<void>;

  cleanupExpiredCheckouts(): Promise<number>;
}

import { ICheckoutRepository } from "../../domain/repositories/checkout.repository";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import {
  Checkout,
  CheckoutDTO,
  CreateCheckoutData,
} from "../../domain/entities/checkout.entity";
import { CheckoutId } from "../../domain/value-objects/checkout-id.vo";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import { IExternalSettingsService } from "../../domain/ports/external-services";
import { CHECKOUT_DEFAULT_EXPIRY_MINUTES } from "../../domain/constants";
import {
  CartNotFoundError,
  CartOwnershipError,
  CheckoutNotFoundError,
  InvalidCheckoutStateError,
  InvalidOperationError,
} from "../../domain/errors/cart.errors";

// Re-export the entity's canonical DTO (ISO-string dates) so existing
// consumers can keep importing `CheckoutDTO` from the service barrel.
export type { CheckoutDTO } from "../../domain/entities/checkout.entity";

interface InitializeCheckoutDto {
  cartId: string;
  userId?: string;
  guestToken?: string;
  expiresInMinutes?: number;
}

interface CompleteCheckoutDto {
  checkoutId: string;
  userId?: string;
  guestToken?: string;
}

/**
 * Fail-closed ownership: a customer's cart or checkout needs that customer's
 * session, a guest's needs that guest token, and anything else is refused
 * (previously a request with neither identity skipped the check entirely).
 */
export function assertOwnership(
  owned: { cartOwnerId?: { getValue(): string } | null; guestToken?: { getValue(): string } | null },
  userId?: string,
  guestToken?: string,
): void {
  const ownerId = owned.cartOwnerId?.getValue();
  const ownerToken = owned.guestToken?.getValue();
  if (ownerId) {
    if (ownerId !== userId) throw new CartOwnershipError("Checkout does not belong to user");
    return;
  }
  if (ownerToken) {
    if (ownerToken !== guestToken) throw new CartOwnershipError("Checkout does not belong to guest");
    return;
  }
  throw new CartOwnershipError("Checkout has no owner");
}

export class CheckoutService {
  constructor(
    private readonly checkoutRepository: ICheckoutRepository,
    private readonly cartRepository: ICartRepository,
    private readonly settingsService: IExternalSettingsService,
  ) {}

  async initializeCheckout(dto: InitializeCheckoutDto): Promise<CheckoutDTO> {
    const cartId = CartId.fromString(dto.cartId);
    const cart = await this.cartRepository.findById(cartId);

    if (!cart) {
      throw new CartNotFoundError(dto.cartId);
    }

    assertOwnership(cart, dto.userId, dto.guestToken);

    let totalAmount = cart.total;
    const currency = cart.currency.getValue();

    const cartWithCheckoutInfo =
      await this.cartRepository.getCartWithCheckoutInfo(cartId);

    if (cartWithCheckoutInfo?.shippingMethod === "home") {
      const shippingRates = await this.settingsService.getShippingRates();

      if (cartWithCheckoutInfo.shippingOption === "colombo") {
        totalAmount += shippingRates.colombo;
      } else if (cartWithCheckoutInfo.shippingOption === "suburbs") {
        totalAmount += shippingRates.suburbs;
      }
    }

    // Check if there is already a pending checkout session for this cart that hasn't expired
    const existingCheckout = await this.checkoutRepository.findByCartId(cartId);
    if (existingCheckout && !existingCheckout.isExpired) {
      // If the total amount and currency match, we can reuse it!
      // This solves the React 18 strict double-mount issue elegantly.
      if (existingCheckout.totalAmount === totalAmount && existingCheckout.currency.getValue() === currency) {
        return Checkout.toDTO(existingCheckout);
      }
    }

    const checkoutData: CreateCheckoutData = {
      cartId: dto.cartId,
      userId: dto.userId,
      guestToken: dto.guestToken,
      totalAmount,
      currency,
      expiresInMinutes: dto.expiresInMinutes || CHECKOUT_DEFAULT_EXPIRY_MINUTES,
    };

    const checkout = Checkout.create(checkoutData);
    await this.checkoutRepository.save(checkout);

    const savedCheckout = await this.checkoutRepository.findByCartId(cartId);
    if (!savedCheckout) {
      throw new InvalidOperationError("Failed to create checkout");
    }

    return Checkout.toDTO(savedCheckout);
  }

  async getCheckout(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CheckoutDTO | null> {
    const id = CheckoutId.fromString(checkoutId);
    const checkout = await this.checkoutRepository.findById(id);

    if (!checkout) {
      return null;
    }

    assertOwnership(checkout, userId, guestToken);

    return Checkout.toDTO(checkout);
  }

  async completeCheckout(dto: CompleteCheckoutDto): Promise<CheckoutDTO> {
    const checkoutId = CheckoutId.fromString(dto.checkoutId);
    const checkout = await this.checkoutRepository.findById(checkoutId);

    if (!checkout) {
      throw new CheckoutNotFoundError(dto.checkoutId);
    }

    assertOwnership(checkout, dto.userId, dto.guestToken);

    if (checkout.isExpired) {
      throw new InvalidCheckoutStateError("Checkout has expired");
    }

    if (!checkout.isPending) {
      throw new InvalidCheckoutStateError("Checkout is not in pending state");
    }

    checkout.markAsCompleted();
    await this.checkoutRepository.save(checkout);

    return Checkout.toDTO(checkout);
  }

  async cancelCheckout(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CheckoutDTO> {
    const id = CheckoutId.fromString(checkoutId);
    const checkout = await this.checkoutRepository.findById(id);

    if (!checkout) {
      throw new CheckoutNotFoundError(checkoutId);
    }

    assertOwnership(checkout, userId, guestToken);

    checkout.markAsCancelled();
    await this.checkoutRepository.save(checkout);

    return Checkout.toDTO(checkout);
  }

  async cleanupExpiredCheckouts(): Promise<number> {
    return await this.checkoutRepository.cleanupExpiredCheckouts();
  }
}

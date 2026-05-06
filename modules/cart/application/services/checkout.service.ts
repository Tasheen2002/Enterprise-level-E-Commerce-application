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

    if (dto.userId && cart.cartOwnerId?.getValue() !== dto.userId) {
      throw new CartOwnershipError("Cart does not belong to user");
    }

    if (dto.guestToken && cart.guestToken?.getValue() !== dto.guestToken) {
      throw new CartOwnershipError("Cart does not belong to guest");
    }

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

    if (userId && checkout.cartOwnerId?.getValue() !== userId) {
      throw new CartOwnershipError("Checkout does not belong to user");
    }

    if (guestToken && checkout.guestToken?.getValue() !== guestToken) {
      throw new CartOwnershipError("Checkout does not belong to guest");
    }

    return Checkout.toDTO(checkout);
  }

  async completeCheckout(dto: CompleteCheckoutDto): Promise<CheckoutDTO> {
    const checkoutId = CheckoutId.fromString(dto.checkoutId);
    const checkout = await this.checkoutRepository.findById(checkoutId);

    if (!checkout) {
      throw new CheckoutNotFoundError(dto.checkoutId);
    }

    if (dto.userId && checkout.cartOwnerId?.getValue() !== dto.userId) {
      throw new CartOwnershipError("Checkout does not belong to user");
    }

    if (dto.guestToken && checkout.guestToken?.getValue() !== dto.guestToken) {
      throw new CartOwnershipError("Checkout does not belong to guest");
    }

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

    if (userId && checkout.cartOwnerId?.getValue() !== userId) {
      throw new CartOwnershipError("Checkout does not belong to user");
    }

    if (guestToken && checkout.guestToken?.getValue() !== guestToken) {
      throw new CartOwnershipError("Checkout does not belong to guest");
    }

    checkout.markAsCancelled();
    await this.checkoutRepository.save(checkout);

    return Checkout.toDTO(checkout);
  }

  async cleanupExpiredCheckouts(): Promise<number> {
    return await this.checkoutRepository.cleanupExpiredCheckouts();
  }
}

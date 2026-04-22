import { ICheckoutRepository } from "../../domain/repositories/checkout.repository";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import {
  Checkout,
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

export interface CheckoutDto {
  checkoutId: string;
  cartId: string;
  userId?: string;
  guestToken?: string;
  status: string;
  totalAmount: number;
  currency: string;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CheckoutService {
  constructor(
    private readonly checkoutRepository: ICheckoutRepository,
    private readonly cartRepository: ICartRepository,
    private readonly settingsService: IExternalSettingsService,
  ) {}

  async initializeCheckout(dto: InitializeCheckoutDto): Promise<CheckoutDto> {
    // Validate cart exists
    const cartId = CartId.fromString(dto.cartId);
    const cart = await this.cartRepository.findById(cartId);

    if (!cart) {
      throw new CartNotFoundError(dto.cartId);
    }

    // Validate cart belongs to user or guest
    if (dto.userId && cart.cartOwnerId?.getValue() !== dto.userId) {
      throw new CartOwnershipError("Cart does not belong to user");
    }

    if (dto.guestToken && cart.guestToken?.getValue() !== dto.guestToken) {
      throw new CartOwnershipError("Cart does not belong to guest");
    }

    // Calculate total amount with shipping
    let totalAmount = cart.total;
    const currency = cart.currency.getValue();

    // Get checkout info to calculate shipping
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

    // Fetch the checkout back to get the actual ID (in case it was upserted)
    const savedCheckout = await this.checkoutRepository.findByCartId(cartId);
    if (!savedCheckout) {
      throw new InvalidOperationError("Failed to create checkout");
    }

    return this.mapCheckoutToDto(savedCheckout);
  }

  async getCheckout(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CheckoutDto | null> {
    const id = CheckoutId.fromString(checkoutId);
    const checkout = await this.checkoutRepository.findById(id);

    if (!checkout) {
      return null;
    }

    // Validate ownership
    if (userId && checkout.cartOwnerId?.getValue() !== userId) {
      throw new CartOwnershipError("Checkout does not belong to user");
    }

    if (guestToken && checkout.guestToken?.getValue() !== guestToken) {
      throw new CartOwnershipError("Checkout does not belong to guest");
    }

    return this.mapCheckoutToDto(checkout);
  }

  async completeCheckout(dto: CompleteCheckoutDto): Promise<CheckoutDto> {
    const checkoutId = CheckoutId.fromString(dto.checkoutId);
    const checkout = await this.checkoutRepository.findById(checkoutId);

    if (!checkout) {
      throw new CheckoutNotFoundError(dto.checkoutId);
    }

    // Validate ownership
    if (dto.userId && checkout.cartOwnerId?.getValue() !== dto.userId) {
      throw new CartOwnershipError("Checkout does not belong to user");
    }

    if (dto.guestToken && checkout.guestToken?.getValue() !== dto.guestToken) {
      throw new CartOwnershipError("Checkout does not belong to guest");
    }

    // Validate checkout is still valid
    if (checkout.isExpired) {
      throw new InvalidCheckoutStateError("Checkout has expired");
    }

    if (!checkout.isPending) {
      throw new InvalidCheckoutStateError("Checkout is not in pending state");
    }

    // Link payment intent and mark as completed
    checkout.markAsCompleted();

    await this.checkoutRepository.save(checkout);

    return this.mapCheckoutToDto(checkout);
  }

  async cancelCheckout(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CheckoutDto> {
    const id = CheckoutId.fromString(checkoutId);
    const checkout = await this.checkoutRepository.findById(id);

    if (!checkout) {
      throw new CheckoutNotFoundError(checkoutId);
    }

    // Validate ownership
    if (userId && checkout.cartOwnerId?.getValue() !== userId) {
      throw new CartOwnershipError("Checkout does not belong to user");
    }

    if (guestToken && checkout.guestToken?.getValue() !== guestToken) {
      throw new CartOwnershipError("Checkout does not belong to guest");
    }

    checkout.markAsCancelled();
    await this.checkoutRepository.save(checkout);

    return this.mapCheckoutToDto(checkout);
  }

  async cleanupExpiredCheckouts(): Promise<number> {
    return await this.checkoutRepository.cleanupExpiredCheckouts();
  }

  private mapCheckoutToDto(checkout: Checkout): CheckoutDto {
    return {
      checkoutId: checkout.checkoutId.getValue(),
      cartId: checkout.cartId.getValue(),
      userId: checkout.cartOwnerId?.getValue(),
      guestToken: checkout.guestToken?.getValue(),
      status: checkout.status.getValue(),
      totalAmount: checkout.totalAmount,
      currency: checkout.currency.getValue(),
      expiresAt: checkout.expiresAt,
      completedAt: checkout.completedAt || undefined,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
    };
  }
}

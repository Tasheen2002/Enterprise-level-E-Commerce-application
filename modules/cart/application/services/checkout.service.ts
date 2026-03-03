import { CheckoutRepository } from "../../domain/repositories/checkout.repository";
import { CartRepository } from "../../domain/repositories/cart.repository";
import {
  Checkout,
  CreateCheckoutData,
} from "../../domain/entities/checkout.entity";
import { CheckoutId } from "../../domain/value-objects/checkout-id.vo";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import { SettingsService } from "../../../admin/application/services/settings.service";
import { CHECKOUT_DEFAULT_EXPIRY_MINUTES } from "../../domain/constants";

export interface InitializeCheckoutDto {
  cartId: string;
  userId?: string;
  guestToken?: string;
  expiresInMinutes?: number;
}

export interface CompleteCheckoutDto {
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
    private readonly checkoutRepository: CheckoutRepository,
    private readonly cartRepository: CartRepository,
    private readonly settingsService: SettingsService,
  ) {}

  async initializeCheckout(dto: InitializeCheckoutDto): Promise<CheckoutDto> {
    // Validate cart exists
    const cartId = CartId.fromString(dto.cartId);
    const cart = await this.cartRepository.findById(cartId);

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Validate cart belongs to user or guest
    if (dto.userId && cart.getUserId()?.toString() !== dto.userId) {
      throw new Error("Cart does not belong to user");
    }

    if (dto.guestToken && cart.getGuestToken()?.toString() !== dto.guestToken) {
      throw new Error("Cart does not belong to guest");
    }

    // Calculate total amount with shipping
    let totalAmount = cart.getTotal();
    const currency = cart.getCurrency().toString();

    // Get checkout info to calculate shipping
    const cartWithCheckoutInfo =
      await this.cartRepository.getCartWithCheckoutInfo(cartId.getValue());

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
      throw new Error("Failed to create checkout");
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
    if (userId && checkout.getUserId()?.toString() !== userId) {
      throw new Error("Checkout does not belong to user");
    }

    if (guestToken && checkout.getGuestToken()?.toString() !== guestToken) {
      throw new Error("Checkout does not belong to guest");
    }

    return this.mapCheckoutToDto(checkout);
  }

  async completeCheckout(dto: CompleteCheckoutDto): Promise<CheckoutDto> {
    const checkoutId = CheckoutId.fromString(dto.checkoutId);
    const checkout = await this.checkoutRepository.findById(checkoutId);

    if (!checkout) {
      throw new Error("Checkout not found");
    }

    // Validate ownership
    if (dto.userId && checkout.getUserId()?.toString() !== dto.userId) {
      throw new Error("Checkout does not belong to user");
    }

    if (
      dto.guestToken &&
      checkout.getGuestToken()?.toString() !== dto.guestToken
    ) {
      throw new Error("Checkout does not belong to guest");
    }

    // Validate checkout is still valid
    if (checkout.isExpired()) {
      throw new Error("Checkout has expired");
    }

    if (!checkout.isPending()) {
      throw new Error("Checkout is not in pending state");
    }

    // Link payment intent and mark as completed
    checkout.markAsCompleted();

    await this.checkoutRepository.update(checkout);

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
      throw new Error("Checkout not found");
    }

    // Validate ownership
    if (userId && checkout.getUserId()?.toString() !== userId) {
      throw new Error("Checkout does not belong to user");
    }

    if (guestToken && checkout.getGuestToken()?.toString() !== guestToken) {
      throw new Error("Checkout does not belong to guest");
    }

    checkout.markAsCancelled();
    await this.checkoutRepository.update(checkout);

    return this.mapCheckoutToDto(checkout);
  }

  async cleanupExpiredCheckouts(): Promise<number> {
    return await this.checkoutRepository.cleanupExpiredCheckouts();
  }

  private mapCheckoutToDto(checkout: Checkout): CheckoutDto {
    return {
      checkoutId: checkout.getCheckoutId().toString(),
      cartId: checkout.getCartId().toString(),
      userId: checkout.getUserId()?.toString(),
      guestToken: checkout.getGuestToken()?.toString(),
      status: checkout.getStatus().toString(),
      totalAmount: checkout.getTotalAmount(),
      currency: checkout.getCurrency().toString(),
      expiresAt: checkout.getExpiresAt(),
      completedAt: checkout.getCompletedAt() || undefined,
      createdAt: checkout.getCreatedAt(),
      updatedAt: checkout.getUpdatedAt(),
    };
  }
}

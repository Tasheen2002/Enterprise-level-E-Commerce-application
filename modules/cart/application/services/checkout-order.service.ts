import { randomBytes } from "crypto";
import Stripe from "stripe";
import { ICheckoutRepository } from "../../domain/repositories/checkout.repository";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { IReservationRepository } from "../../domain/repositories/reservation.repository";
import { CheckoutId } from "../../domain/value-objects/checkout-id.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import {
  IExternalProductRepository,
  IExternalProductVariantRepository,
  IExternalStockService,
  IProductSnapshotFactory,
  ICheckoutCompletionPort,
  CheckoutOrderResult,
  PersistCheckoutOrderData,
  IPaymentConfirmationPort,
  ICheckoutPricingPort,
} from "../../domain/ports/external-services";
import { LOYALTY_POINT_REDEMPTION_VALUE } from "../../../loyalty/domain/constants/loyalty.constants";
import { LoyaltyTransactionReasonValue } from "../../../loyalty/domain/value-objects/loyalty-reason.vo";
import {
  CartNotFoundError,
  CheckoutNotFoundError,
  CartOwnershipError,
  InvalidCheckoutStateError,
  InvalidCartStateError,
  PaymentNotConfirmedError,
  PaymentMismatchError,
  DomainValidationError,
} from "../../domain/errors/cart.errors";
import { LoyaltyService } from "../../../loyalty/application/services/loyalty.service";

interface CompleteCheckoutWithOrderDto {
  checkoutId: string;
  paymentIntentId: string;
  userId?: string;
  guestToken?: string;
  promoCode?: string;
  /** Loyalty points to redeem against this order (validated and deducted by the server). */
  pointsToRedeem?: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
    email?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
    email?: string;
  };
}

export type OrderResult = CheckoutOrderResult;

export class CheckoutOrderService {
  // Concurrent completions of one checkout race to claim it inside the
  // persistence transaction. The loser gets the winner's order back (and must
  // skip post-persistence side effects, which the winner performs) so the
  // operation stays idempotent.
  private async persistOrFindWinner(
    data: PersistCheckoutOrderData,
  ): Promise<{ order: OrderResult; created: boolean }> {
    try {
      return { order: await this.completionPort.persistCheckoutOrder(data), created: true };
    } catch (error) {
      if (error instanceof InvalidCheckoutStateError) {
        const winner = await this.completionPort.findExistingOrder(data.checkoutId);
        if (winner) return { order: winner, created: false };
      }
      throw error;
    }
  }

  constructor(
    private readonly completionPort: ICheckoutCompletionPort,
    private readonly checkoutRepository: ICheckoutRepository,
    private readonly cartRepository: ICartRepository,
    private readonly reservationRepository: IReservationRepository,
    private readonly stockService: IExternalStockService,
    private readonly productRepository: IExternalProductRepository,
    private readonly productVariantRepository: IExternalProductVariantRepository,
    private readonly snapshotFactory: IProductSnapshotFactory,
    private readonly config: { defaultStockLocation?: string },
    private readonly loyaltyService: LoyaltyService | undefined,
    private readonly paymentConfirmation: IPaymentConfirmationPort,
    private readonly pricing: ICheckoutPricingPort,
  ) {}

  async completeCheckoutWithOrder(
    dto: CompleteCheckoutWithOrderDto,
  ): Promise<OrderResult> {
    // ---- Phase 1: Validate domain state ----

    const checkoutId = CheckoutId.fromString(dto.checkoutId);
    const checkout = await this.checkoutRepository.findById(checkoutId);

    if (!checkout) {
      throw new CheckoutNotFoundError(dto.checkoutId);
    }

    if (checkout.isExpired) {
      throw new InvalidCheckoutStateError("Checkout has expired");
    }

    if (!checkout.isPending) {
      throw new InvalidCheckoutStateError("Checkout is not in pending state");
    }

    const cart = await this.cartRepository.findById(checkout.cartId);

    if (!cart) {
      throw new CartNotFoundError(checkout.cartId.getValue());
    }

    if (cart.isEmpty) {
      throw new InvalidCartStateError("Cannot create order from empty cart");
    }

    // ---- Phase 2: Validate payment via port ----

    const paymentIntent = await this.completionPort.findPaymentIntent(
      dto.checkoutId,
      dto.paymentIntentId,
    );

    if (!paymentIntent) {
      throw new DomainValidationError("Payment intent not found");
    }

    // A payment pays for exactly one checkout: it must be this checkout's
    // payment and not already attached to an order.
    if (paymentIntent.checkoutId && paymentIntent.checkoutId !== dto.checkoutId) {
      throw new PaymentMismatchError("Payment belongs to a different checkout");
    }
    if (paymentIntent.orderId) {
      throw new PaymentMismatchError("Payment has already been used for an order");
    }

    if (dto.userId && checkout.cartOwnerId?.getValue() !== dto.userId) {
      throw new CartOwnershipError("Checkout does not belong to user");
    }

    if (dto.guestToken && checkout.guestToken?.getValue() !== dto.guestToken) {
      throw new CartOwnershipError("Checkout does not belong to guest");
    }

    // ---- Phase 3: Idempotency check via port ----

    const existingOrder = await this.completionPort.findExistingOrder(
      dto.checkoutId,
    );
    if (existingOrder) {
      return existingOrder;
    }

    // ---- Phase 4: Prepare order data ----

    const orderNo = `ORD-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;

    const cartSnapshot = cart.toSnapshot();
    const subtotal = cart.subtotal;
    const cartItemTotal = cart.total;
    let discount = subtotal - cartItemTotal;

    // Calculate shipping cost matching the storefront logic
    const shipping = subtotal > 150 ? 0 : 15;

    // Calculate sales tax dynamically using Stripe Tax API, matching calculation logic in calculate-checkout-tax.command.ts
    let tax = 0;

    if (dto.shippingAddress && dto.shippingAddress.country) {
      try {
        const lineItems = (cartSnapshot.items || []).map((item, idx) => ({
          amount: Math.round(Number(item.unitPriceSnapshot) * 100), // in cents
          reference: `L${idx}`,
          quantity: item.quantity,
          tax_code: "txcd_30011000", // Standard clothing/footwear tax category
        }));

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2026-02-25.clover" as unknown as "2026-02-25.clover",
        });
        const calculation = await stripe.tax.calculations.create({
          currency: checkout.currency.getValue().toLowerCase(),
          line_items: lineItems,
          customer_details: {
            address: {
              line1: dto.shippingAddress.addressLine1,
              line2: dto.shippingAddress.addressLine2 || undefined,
              city: dto.shippingAddress.city,
              state: dto.shippingAddress.state || undefined,
              postal_code: dto.shippingAddress.postalCode || undefined,
              country: dto.shippingAddress.country,
            },
            address_source: "shipping",
          },
          shipping_cost: shipping > 0 ? { amount: shipping * 100 } : undefined,
        });

        tax = calculation.tax_amount_exclusive / 100;
        if (tax === 0) {
          console.log("Stripe Tax API returned 0 during order completion. Falling back to 8% simulation.");
          tax = parseFloat((subtotal * 0.08).toFixed(2));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Stripe Tax API failed during order completion, falling back to 8% simulation:", msg);
        // Fallback: 8% sales tax simulation
        tax = parseFloat((subtotal * 0.08).toFixed(2));
      }
    } else {
      // Fallback: 8% sales tax simulation
      tax = parseFloat((subtotal * 0.08).toFixed(2));
    }

    // ---- Server-side total: never derived from what the client paid ----
    const round2 = (value: number) => Math.round(value * 100) / 100;
    const promoDiscount = dto.promoCode
      ? round2(
          await this.pricing.promotionDiscount({
            promoCode: dto.promoCode,
            subtotal,
            productIds: (cartSnapshot.items || []).map((item) => item.variantId),
            userId: checkout.cartOwnerId?.getValue(),
            email: dto.shippingAddress.email ?? undefined,
          }),
        )
      : 0;
    const beforeLoyalty = round2(subtotal + shipping + tax - promoDiscount);

    const pointsToRedeem = dto.pointsToRedeem ?? 0;
    if (!Number.isInteger(pointsToRedeem) || pointsToRedeem < 0) {
      throw new DomainValidationError("Points to redeem must be a non-negative whole number");
    }
    let loyaltyDiscount = 0;
    if (pointsToRedeem > 0) {
      const ownerId = checkout.cartOwnerId?.getValue();
      if (!ownerId || !this.loyaltyService) {
        throw new DomainValidationError("Loyalty points can only be redeemed by signed-in customers");
      }
      if (pointsToRedeem > (await this.pricing.loyaltyBalance(ownerId))) {
        throw new DomainValidationError("Not enough loyalty points");
      }
      loyaltyDiscount = round2(pointsToRedeem * LOYALTY_POINT_REDEMPTION_VALUE);
      if (loyaltyDiscount > beforeLoyalty) {
        throw new DomainValidationError("Loyalty points exceed the order total");
      }
    }

    discount = round2(promoDiscount + loyaltyDiscount);
    const total = round2(beforeLoyalty - loyaltyDiscount);

    // ---- Payment must be confirmed by the provider and cover the total ----
    const payment = await this.paymentConfirmation.confirm(paymentIntent);
    if (!payment.succeeded) {
      throw new PaymentNotConfirmedError();
    }
    if (payment.currency.toLowerCase() !== checkout.currency.getValue().toLowerCase()) {
      throw new PaymentMismatchError("Payment currency does not match the checkout");
    }
    if (payment.amount + 0.005 < total) {
      throw new PaymentMismatchError(
        `Payment of ${payment.amount.toFixed(2)} does not cover the order total of ${total.toFixed(2)}`,
      );
    }

    const totals = {
      subtotal,
      tax,
      shipping,
      discount,
      total,
    };

    // Build product snapshots for each cart item
    const orderItems: Array<{
      variantId: string;
      qty: number;
      productSnapshot: Record<string, unknown>;
      isGift: boolean;
      giftMessage?: string;
    }> = [];

    for (const item of cartSnapshot.items || []) {
      const variant = await this.productVariantRepository.findById(
        VariantId.fromString(item.variantId),
      );

      if (!variant) {
        throw new DomainValidationError(`Variant not found: ${item.variantId}`);
      }

      const product = await this.productRepository.findById(
        variant.getProductId(),
      );

      if (!product) {
        throw new DomainValidationError(
          `Product not found for variant: ${item.variantId}`,
        );
      }

      const productSnapshot = this.snapshotFactory.create({
        productId: product.getId().getValue(),
        variantId: variant.getId().getValue(),
        sku: variant.getSku().getValue(),
        name: product.getTitle(),
        variantName:
          [variant.getSize(), variant.getColor()].filter(Boolean).join(" / ") ||
          undefined,
        price: product.getPrice().getValue(),
        imageUrl: undefined,
        weight: variant.getWeightG() || undefined,
        attributes: {
          size: variant.getSize(),
          color: variant.getColor(),
        },
      });

      orderItems.push({
        variantId: item.variantId,
        qty: item.quantity,
        productSnapshot: productSnapshot.toJSON() as unknown as Record<
          string,
          unknown
        >,
        isGift: item.isGift,
        giftMessage: item.giftMessage,
      });
    }

    // Resolve warehouse
    const warehouseId = await this.resolveWarehouseId();

    // Get cart email for address records
    const cartEmail = await this.completionPort.getCartEmail(
      checkout.cartId.getValue(),
    );

    // Get user email from profile if authenticated
    let userEmail: string | null = null;
    if (checkout.cartOwnerId) {
      userEmail = await this.completionPort.getUserEmail(
        checkout.cartOwnerId.getValue(),
      );
    }

    const resolvedEmail =
      dto.shippingAddress.email ||
      dto.billingAddress?.email ||
      cartEmail ||
      userEmail ||
      undefined;

    // ---- Phase 5: Atomic persistence via port ----

    const persisted = await this.persistOrFindWinner({
      orderNo,
      userId: checkout.cartOwnerId?.getValue(),
      guestToken: checkout.guestToken?.getValue(),
      checkoutId: dto.checkoutId,
      paymentIntentId: paymentIntent.intentId,
      currency: checkout.currency.getValue(),
      totals,
      items: orderItems,
      shippingAddress: {
        ...dto.shippingAddress,
        email: resolvedEmail,
      },
      billingAddress: {
        ...(dto.billingAddress || dto.shippingAddress),
        email: resolvedEmail,
      },
      email: resolvedEmail,
      cartId: checkout.cartId.getValue(),
      promoCode: promoDiscount > 0 ? dto.promoCode : undefined,
      promoDiscount,
      stockAdjustments: (cartSnapshot.items || []).map((item) => ({
        variantId: item.variantId,
        warehouseId,
        quantity: -item.quantity,
      })),
    });

    const result = persisted.order;
    if (!persisted.created) return result;

    // ---- Phase 6: Post-persistence side effects ----

    // Stock was deducted inside the order transaction (see the completion port).

    // Clean up reservations
    await this.reservationRepository.deleteByCartId(checkout.cartId);

    // Redeem the loyalty points that were credited against this order.
    if (pointsToRedeem > 0 && checkout.cartOwnerId && this.loyaltyService) {
      try {
        await this.loyaltyService.redeemPoints({
          userId: checkout.cartOwnerId.getValue(),
          points: pointsToRedeem,
          reason: LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION,
          orderId: result.orderId,
          description: `Redeemed at checkout for order ${result.orderNo}`,
        });
      } catch (err: unknown) {
        // The balance was checked before payment confirmation; a failure
        // here means a concurrent redemption and needs manual follow-up.
        console.error("Failed to redeem loyalty points for checkout order:", result.orderId, err);
      }
    }

    // Award loyalty points for authenticated user checkout
    if (checkout.cartOwnerId && this.loyaltyService) {
      try {
        await this.loyaltyService.earnPointsFromPurchase(
          checkout.cartOwnerId.getValue(),
          totals.total,
          result.orderId,
        );
      } catch (err: unknown) {
        console.error("Failed to earn loyalty points from checkout purchase:", err);
      }
    }

    return result;
  }

  async getOrderByCheckoutId(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<OrderResult | null> {
    return this.completionPort.findOrderByCheckoutId(
      checkoutId,
      userId,
      guestToken,
    );
  }

  private async resolveWarehouseId(): Promise<string> {
    if (this.config.defaultStockLocation) {
      return this.config.defaultStockLocation;
    }

    const warehouseId = await this.stockService.findWarehouseId();
    if (!warehouseId) {
      throw new DomainValidationError(
        "No warehouse location found. Please configure DEFAULT_STOCK_LOCATION in .env or create a warehouse location in the database.",
      );
    }

    return warehouseId;
  }
}

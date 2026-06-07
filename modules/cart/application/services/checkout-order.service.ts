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
} from "../../domain/ports/external-services";
import {
  CartNotFoundError,
  CheckoutNotFoundError,
  CartOwnershipError,
  InvalidCheckoutStateError,
  InvalidCartStateError,
  DomainValidationError,
} from "../../domain/errors/cart.errors";

interface CompleteCheckoutWithOrderDto {
  checkoutId: string;
  paymentIntentId: string;
  userId?: string;
  guestToken?: string;
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
  private readonly stripe: Stripe;

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
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2026-02-25.clover" as unknown as "2026-02-25.clover",
    });
  }

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

    const validStatuses = ["authorized", "captured", "requires_action"];
    if (!validStatuses.includes(paymentIntent.status)) {
      throw new InvalidCheckoutStateError(
        `Payment intent is not authorized. Current status: ${paymentIntent.status}`,
      );
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

        const calculation = await this.stripe.tax.calculations.create({
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

    // The final total settled is the actual amount paid via the PaymentIntent
    const total = paymentIntent.amount;

    // Calculate discount based on the final paid total (subtotal + shipping + tax - paidTotal)
    discount = Math.max(0, parseFloat((subtotal + shipping + tax - total).toFixed(2)));

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

    const result = await this.completionPort.persistCheckoutOrder({
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
      stockAdjustments: (cartSnapshot.items || []).map((item) => ({
        variantId: item.variantId,
        warehouseId,
        quantity: -item.quantity,
      })),
    });

    // ---- Phase 6: Post-persistence side effects ----

    // Adjust stock (external service, not part of the order transaction)
    for (const item of cartSnapshot.items || []) {
      await this.stockService.adjustStock(
        item.variantId,
        warehouseId,
        -item.quantity,
        "order",
        result.orderId,
      );
    }

    // Clean up reservations
    await this.reservationRepository.deleteByCartId(checkout.cartId);

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

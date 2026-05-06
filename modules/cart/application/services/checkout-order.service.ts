import { randomBytes } from "crypto";
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
  };
}

export type OrderResult = CheckoutOrderResult;

export class CheckoutOrderService {
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
    const total = checkout.totalAmount;
    const cartItemTotal = cart.total;
    const shipping = total - cartItemTotal;

    const totals = {
      subtotal,
      tax: 0,
      shipping,
      discount: subtotal - cartItemTotal,
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

    // ---- Phase 5: Atomic persistence via port ----

    const result = await this.completionPort.persistCheckoutOrder({
      orderNo,
      userId: checkout.cartOwnerId?.getValue(),
      guestToken: checkout.guestToken?.getValue(),
      checkoutId: dto.checkoutId,
      paymentIntentId: dto.paymentIntentId,
      currency: checkout.currency.getValue(),
      totals,
      items: orderItems,
      shippingAddress: { ...dto.shippingAddress, email: cartEmail },
      billingAddress: {
        ...(dto.billingAddress || dto.shippingAddress),
        email: cartEmail,
      },
      email: cartEmail ?? undefined,
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

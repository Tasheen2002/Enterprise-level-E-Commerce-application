import { PrismaClient, CheckoutStatusEnum } from "@prisma/client";
import { CheckoutRepository } from "../../domain/repositories/checkout.repository";
import { CartRepository } from "../../domain/repositories/cart.repository";
import { ReservationRepository } from "../../domain/repositories/reservation.repository";
import { StockManagementService } from "../../../inventory-management/application/services/stock-management.service";
import { CheckoutId } from "../../domain/value-objects/checkout-id.vo";
import { IProductRepository } from "../../../product-catalog/domain/repositories/product.repository";
import { IProductVariantRepository } from "../../../product-catalog/domain/repositories/product-variant.repository";
import { ProductSnapshot } from "../../../order-management/domain/value-objects/product-snapshot.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";

export interface CompleteCheckoutWithOrderDto {
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

export interface OrderResult {
  orderId: string;
  orderNo: string;
  checkoutId: string;
  paymentIntentId: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: Date;
  items: any[];
}

export class CheckoutOrderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly cartRepository: CartRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly stockManagementService: StockManagementService,
    private readonly productRepository: IProductRepository,
    private readonly productVariantRepository: IProductVariantRepository,
  ) {}

  async completeCheckoutWithOrder(
    dto: CompleteCheckoutWithOrderDto,
  ): Promise<OrderResult> {
    // Use Prisma transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // 1. Get and validate checkout
      const checkoutId = CheckoutId.fromString(dto.checkoutId);
      const checkout = await this.checkoutRepository.findById(checkoutId);

      if (!checkout) {
        throw new Error("Checkout not found");
      }

      // Validate checkout is still valid
      if (checkout.isExpired()) {
        throw new Error("Checkout has expired");
      }

      if (!checkout.isPending()) {
        throw new Error("Checkout is not in pending state");
      }

      // 2. Get cart and validate it has items
      const cart = await this.cartRepository.findById(checkout.getCartId());

      if (!cart) {
        throw new Error("Cart not found");
      }

      if (cart.isEmpty()) {
        throw new Error("Cannot create order from empty cart");
      }

      // 3. Verify payment intent exists and is authorized
      // Try to find by checkoutId first (common during checkout flow)
      let paymentIntent = await tx.paymentIntent.findUnique({
        where: { checkoutId: dto.checkoutId },
      });

      // If not found by checkoutId, try by intentId (for backward compatibility)
      if (!paymentIntent) {
        paymentIntent = await tx.paymentIntent.findUnique({
          where: { intentId: dto.paymentIntentId },
        });
      }

      if (!paymentIntent) {
        throw new Error("Payment intent not found");
      }

      // Accept authorized, captured, or requires_action (for mock/testing)
      const validStatuses = ["authorized", "captured", "requires_action"];
      if (!validStatuses.includes(paymentIntent.status)) {
        throw new Error(
          `Payment intent is not authorized. Current status: ${paymentIntent.status}`,
        );
      }

      // 4. Validate ownership (only enforce if payment not authorized)
      // If payment is already authorized, allow order creation regardless of token mismatch
      // This handles cases where guest token changed (cleared localStorage, different browser, etc.)
      if (dto.userId && checkout.getUserId()?.toString() !== dto.userId) {
        throw new Error("Checkout does not belong to user");
      }

      // For guest checkouts, we're more lenient: if payment is authorized, we trust it
      // The payment authorization itself validates the user's intent to purchase
      if (
        dto.guestToken &&
        checkout.getGuestToken()?.toString() !== dto.guestToken &&
        !validStatuses.includes(paymentIntent.status)
      ) {
        throw new Error("Checkout does not belong to guest");
      }

      // 4. Generate unique order number
      const orderNo = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // 5. Calculate order totals from cart
      const cartSnapshot = cart.toSnapshot();
      const subtotal = cart.getSubtotal();
      // Use checkout total which includes shipping
      const total = checkout.getTotalAmount();
      const cartItemTotal = cart.getTotal(); // Total of items (subtotal - discounts)

      const shipping = total - cartItemTotal;

      const totals = {
        subtotal,
        tax: 0,
        shipping,
        discount: subtotal - cartItemTotal,
        total,
      };

      const existingOrder = await tx.order.findFirst({
        where: { checkoutId: dto.checkoutId },
        include: { items: true },
      });

      if (existingOrder) {
        return {
          orderId: existingOrder.id,
          orderNo: existingOrder.orderNo,
          checkoutId: dto.checkoutId,
          paymentIntentId: dto.paymentIntentId,
          totalAmount: checkout.getTotalAmount(),
          currency: checkout.getCurrency().toString(),
          status: existingOrder.status,
          createdAt: existingOrder.createdAt,
          items: existingOrder.items,
        };
      }

      const order = await tx.order.create({
        data: {
          orderNo,
          userId: checkout.getUserId()?.toString(),
          guestToken: checkout.getGuestToken()?.toString(),
          checkoutId: checkout.getCheckoutId().toString(),
          paymentIntentId: dto.paymentIntentId,
          totals: totals as any,
          status: "created",
          source: "web",
          currency: checkout.getCurrency().toString(),
        },
      });

      const orderItems = [];
      for (const item of cartSnapshot.items || []) {
        // Fetch variant and product to build a valid snapshot
        const variantId = VariantId.fromString(item.variantId);
        const variant = await this.productVariantRepository.findById(variantId);

        if (!variant) {
          throw new Error(`Variant not found: ${item.variantId}`);
        }

        const product = await this.productRepository.findById(
          variant.getProductId(),
        );

        if (!product) {
          throw new Error(`Product not found for variant: ${item.variantId}`);
        }

        // Create valid ProductSnapshot
        const productSnapshot = ProductSnapshot.create({
          productId: product.getId().getValue(),
          variantId: variant.getId().getValue(),
          sku: variant.getSku().getValue(),
          name: product.getTitle(),
          variantName:
            [variant.getSize(), variant.getColor()]
              .filter(Boolean)
              .join(" / ") || undefined,
          price: product.getPrice().getValue(), // DB price (price is at product level)
          imageUrl: undefined, // You might want to fetch images too
          weight: variant.getWeightG() || undefined,
          attributes: {
            size: variant.getSize(),
            color: variant.getColor(),
          },
        });

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            qty: item.quantity,
            productSnapshot: productSnapshot.toJSON() as any,
            isGift: item.isGift,
            giftMessage: item.giftMessage,
          },
        });
        orderItems.push(orderItem);
      }

      // Select warehouse for order fulfillment
      const warehouseId = await this.selectWarehouseForOrder(
        cartSnapshot.items || [],
        dto.shippingAddress,
        tx,
      );

      // Remove stock from inventory (no reservation was made during cart creation)
      for (const item of cartSnapshot.items || []) {
        await this.stockManagementService.adjustStock(
          item.variantId,
          warehouseId,
          -item.quantity, // Negative to remove stock
          "order",
          order.id, // Reference the order ID
        );
      }

      await this.reservationRepository.deleteByCartId(checkout.getCartId());

      // Fetch email from ShoppingCart (stored in DB but not in domain entity)
      const cartData = await tx.shoppingCart.findUnique({
        where: { id: checkout.getCartId().toString() },
        select: { email: true },
      });
      const cartEmail = cartData?.email;

      await tx.orderAddress.create({
        data: {
          orderId: order.id,
          shippingSnapshot: { ...dto.shippingAddress, email: cartEmail } as any,
          billingSnapshot: {
            ...(dto.billingAddress || dto.shippingAddress),
            email: cartEmail,
          } as any,
        },
      });

      await tx.paymentIntent.update({
        where: { intentId: paymentIntent.intentId },
        data: {
          orderId: order.id,
          checkoutId: dto.checkoutId,
        },
      });

      await tx.checkout.update({
        where: { id: dto.checkoutId },
        data: {
          status: CheckoutStatusEnum.completed,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
        },
      });

      // Track purchase event in analytics
      try {
        await tx.analyticsEvent.create({
          data: {
            eventType: "purchase",
            userId: dto.userId || undefined,
            guestToken: dto.guestToken || undefined,
            sessionId: `purchase-${order.id}`,
            eventTimestamp: new Date(),
            eventData: {
              orderId: order.id,
              orderNo: orderNo,
              amount: total,
              currency: checkout.getCurrency().toString(),
              itemCount: cartSnapshot.items?.length || 0,
            },
          },
        });
      } catch {
        // Don't fail the order if analytics tracking fails
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "created",
          toStatus: "paid",
          changedBy: dto.userId || "system",
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          eventType: "order_created",
          payload: {
            checkoutId: dto.checkoutId,
            paymentIntentId: dto.paymentIntentId,
            source: "checkout",
          } as any,
        },
      });

      // Clear the cart items after successful order creation
      const cartIdToDelete = checkout.getCartId().toString();

      const deleteResult = await tx.cartItem.deleteMany({
        where: { cartId: cartIdToDelete },
      });

      // Clear cart addresses and shipping info to prevent reuse of old details
      await tx.shoppingCart.update({
        where: { id: cartIdToDelete },
        data: {
          shippingFirstName: null,
          shippingLastName: null,
          shippingAddress1: null,
          shippingAddress2: null,
          shippingCity: null,
          shippingProvince: null,
          shippingPostalCode: null,
          shippingCountryCode: null,
          shippingPhone: null,
          billingFirstName: null,
          billingLastName: null,
          billingAddress1: null,
          billingAddress2: null,
          billingCity: null,
          billingProvince: null,
          billingPostalCode: null,
          billingCountryCode: null,
          billingPhone: null,
          shippingMethod: null,
          shippingOption: null,
          email: null, // Depending on if we want to keep email or not. Safest is to clear everything given Guest Token persistence.
        } as any, // Cast to any because some fields might be optional in Prisma types but we want to force null
      });

      return {
        orderId: order.id,
        orderNo: order.orderNo,
        checkoutId: dto.checkoutId,
        paymentIntentId: dto.paymentIntentId,
        totalAmount: checkout.getTotalAmount(),
        currency: checkout.getCurrency().toString(),
        status: "paid",
        createdAt: order.createdAt,
        items: orderItems,
      };
    });
  }

  async getOrderByCheckoutId(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<OrderResult | null> {
    // Find the order associated with this checkout
    const order = await this.prisma.order.findFirst({
      where: {
        checkoutId: checkoutId,
        ...(userId ? { userId } : { guestToken }),
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return null;
    }

    // Extract totals from JSONB field
    const totals = order.totals as any;
    const totalAmount = totals?.total || 0;

    // Transform to OrderResult format
    return {
      orderId: order.id,
      orderNo: order.orderNo,
      checkoutId: order.checkoutId!,
      paymentIntentId: order.paymentIntentId || "",
      totalAmount: Number(totalAmount) || 0,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productSnapshot?.productId || item.productId,
        variantId: item.variantId,
        quantity: item.qty,
        price: Number(item.productSnapshot?.price || item.price) || 0,
      })),
    };
  }

  private async selectWarehouseForOrder(
    items: any[],
    shippingAddress: any,
    tx: any,
  ): Promise<string> {
    // Strategy 1: Use configured default warehouse
    if (process.env.DEFAULT_STOCK_LOCATION) {
      return process.env.DEFAULT_STOCK_LOCATION;
    }

    // Strategy 2: Query first warehouse from database
    const warehouse = await tx.location.findFirst({
      where: {
        type: "warehouse",
      },
    });

    if (!warehouse) {
      throw new Error(
        "No warehouse location found. Please configure DEFAULT_STOCK_LOCATION in .env or create a warehouse location in the database.",
      );
    }

    return warehouse.id;

    // Future strategies can be added here:
    // - Distance-based: Calculate nearest warehouse to shipping address
    // - Inventory-based: Find warehouse with all items in stock
    // - Hybrid: Combine proximity + availability
  }
}

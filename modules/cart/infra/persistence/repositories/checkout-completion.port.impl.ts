import { PrismaClient, Prisma } from "@prisma/client";

interface ExtendedPrismaTransaction {
  adminNotification: {
    create(args: {
      data: {
        type: string;
        title: string;
        message: string;
        targetUrl: string;
      };
    }): Promise<unknown>;
  };
}

import {
  ICheckoutCompletionPort,
  PaymentIntentInfo,
  CheckoutOrderResult,
  PersistCheckoutOrderData,
} from "../../../domain/ports/external-services";

export class CheckoutCompletionPortImpl implements ICheckoutCompletionPort {
  constructor(private readonly prisma: PrismaClient) {}

  async findPaymentIntent(
    checkoutId: string,
    paymentIntentId: string,
  ): Promise<PaymentIntentInfo | null> {
    // Try by checkoutId first (common during checkout flow)
    let pi = await this.prisma.paymentIntent.findUnique({
      where: { checkoutId },
      select: { intentId: true, status: true, amount: true },
    });

    // Fallback to intentId or clientSecret
    if (!pi && paymentIntentId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentIntentId);
      if (isUuid) {
        pi = await this.prisma.paymentIntent.findUnique({
          where: { intentId: paymentIntentId },
          select: { intentId: true, status: true, amount: true },
        });
      } else {
        pi = await this.prisma.paymentIntent.findFirst({
          where: { clientSecret: paymentIntentId },
          select: { intentId: true, status: true, amount: true },
        });
      }
    }

    if (!pi) return null;

    return {
      intentId: pi.intentId,
      status: pi.status,
      amount: Number(pi.amount),
    };
  }

  async findExistingOrder(
    checkoutId: string,
  ): Promise<CheckoutOrderResult | null> {
    const order = await this.prisma.order.findFirst({
      where: { checkoutId },
      include: { items: true },
    });

    if (!order) return null;

    const totals = order.totals as Record<string, unknown>;
    return {
      orderId: order.id,
      orderNo: order.orderNo,
      checkoutId: order.checkoutId!,
      paymentIntentId: order.paymentIntentId || "",
      totalAmount: Number(totals?.total) || 0,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    };
  }

  async getCartEmail(cartId: string): Promise<string | null> {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { id: cartId },
      select: { email: true },
    });
    return cart?.email ?? null;
  }

  async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  async findOrderByCheckoutId(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CheckoutOrderResult | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        checkoutId,
        ...(userId ? { userId } : { guestToken }),
      },
      include: { items: true },
    });

    if (!order) return null;

    const totals = order.totals as Record<string, unknown>;
    return {
      orderId: order.id,
      orderNo: order.orderNo,
      checkoutId: order.checkoutId!,
      paymentIntentId: order.paymentIntentId || "",
      totalAmount: Number(totals?.total) || 0,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item) => {
        const snapshot = item.productSnapshot as Record<string, unknown> | null;
        return {
          id: item.id,
          productId: (snapshot?.productId as string | undefined) ?? "",
          variantId: item.variantId,
          quantity: item.qty,
          price: Number(snapshot?.price) || 0,
        };
      }),
    };
  }

  async persistCheckoutOrder(
    data: PersistCheckoutOrderData,
  ): Promise<CheckoutOrderResult> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create order
      const order = await tx.order.create({
        data: {
          orderNo: data.orderNo,
          userId: data.userId,
          guestToken: data.guestToken,
          checkoutId: data.checkoutId,
          paymentIntentId: data.paymentIntentId,
          totals: data.totals as unknown as Prisma.InputJsonValue,
          status: "created",
          source: "web",
          currency: data.currency,
        },
      });

      // 2. Create order items
      const orderItems = [];
      for (const item of data.items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            qty: item.qty,
            productSnapshot: item.productSnapshot as unknown as Prisma.InputJsonValue,
            isGift: item.isGift,
            giftMessage: item.giftMessage,
          },
        });
        orderItems.push(orderItem);
      }

      // 3. Create order address
      let resolvedEmail = data.email || (data.shippingAddress as any).email || (data.billingAddress as any).email;
      if (!resolvedEmail && data.userId) {
        const user = await tx.user.findUnique({
          where: { id: data.userId },
          select: { email: true },
        });
        if (user) {
          resolvedEmail = user.email;
        }
      }

      const shippingSnapshot = {
        ...(data.shippingAddress as Record<string, unknown>),
        ...(resolvedEmail ? { email: resolvedEmail } : {}),
      };

      const billingSnapshot = {
        ...(data.billingAddress as Record<string, unknown>),
        ...(resolvedEmail ? { email: resolvedEmail } : {}),
      };

      await tx.orderAddress.create({
        data: {
          orderId: order.id,
          shippingSnapshot: shippingSnapshot as unknown as Prisma.InputJsonValue,
          billingSnapshot: billingSnapshot as unknown as Prisma.InputJsonValue,
        },
      });

      // 4. Link payment intent to order
      const pi = await tx.paymentIntent.findUnique({
        where: { checkoutId: data.checkoutId },
      });
      if (!pi) {
        const piFallback = await tx.paymentIntent.findUnique({
          where: { intentId: data.paymentIntentId },
        });
        if (piFallback) {
          await tx.paymentIntent.update({
            where: { intentId: piFallback.intentId },
            data: { orderId: order.id, checkoutId: data.checkoutId },
          });
        }
      } else {
        await tx.paymentIntent.update({
          where: { intentId: pi.intentId },
          data: { orderId: order.id, checkoutId: data.checkoutId },
        });
      }

      // 5. Complete checkout
      await tx.checkout.update({
        where: { id: data.checkoutId },
        data: {
          status: "completed",
          totalAmount: data.totals.total,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 6. Mark order as paid
      await tx.order.update({
        where: { id: order.id },
        data: { status: "paid" },
      });

      // 7. Record analytics (best-effort, don't fail order)
      try {
        await tx.analyticsEvent.create({
          data: {
            eventType: "purchase",
            userId: data.userId || undefined,
            guestToken: data.guestToken || undefined,
            sessionId: `purchase-${order.id}`,
            eventTimestamp: new Date(),
            eventData: {
              orderId: order.id,
              orderNo: data.orderNo,
              amount: data.totals.total,
              currency: data.currency,
              itemCount: data.items.length,
            },
          },
        });
      } catch {
        // Analytics failure must not abort the order
      }

      // 8. Record order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "created",
          toStatus: "paid",
          changedBy: data.userId || "system",
        },
      });

      // 9. Record order event
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          eventType: "order_created",
          payload: {
            checkoutId: data.checkoutId,
            paymentIntentId: data.paymentIntentId,
            source: "checkout",
          } as unknown as Prisma.InputJsonValue,
        },
      });

      // Create Admin In-App Notifications
      try {
        // 1. New Order Commissioned Notification
        await (tx as unknown as ExtendedPrismaTransaction).adminNotification.create({
          data: {
            type: "ORDER_CREATED",
            title: "New Boutique Order Commissioned",
            message: `Order #${order.orderNo} placed for a total of $${Number(data.totals.total).toFixed(2)}.`,
            targetUrl: `/orders/${order.id}`,
          },
        });

        // 2. Low Stock Alerts
        for (const item of data.stockAdjustments) {
          const stock = await tx.inventoryStock.findUnique({
            where: {
              variantId_locationId: {
                variantId: item.variantId,
                locationId: item.warehouseId,
              },
            },
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          });

          if (stock) {
            const quantitySubtracted = Math.abs(item.quantity);
            const remaining = (stock.onHand - stock.reserved) - quantitySubtracted;

            if (remaining >= 0 && remaining <= 3) {
              const productTitle = stock.variant.product?.title || "Item";
              const sizeStr = stock.variant.size ? ` (Size: ${stock.variant.size})` : "";
              
              await (tx as unknown as ExtendedPrismaTransaction).adminNotification.create({
                data: {
                  type: "LOW_STOCK",
                  title: `Low Stock: ${productTitle}${sizeStr}`,
                  message: `Only ${remaining} units remaining in boutique inventory. Consider restocking.`,
                  targetUrl: `/products/${stock.variant.productId}/variants`,
                },
              });
            }
          }
        }
      } catch (err: unknown) {
        console.error("Failed to create admin notification:", err);
        try {
          const fs = require("fs");
          const path = require("path");
          const logPath = path.join(__dirname, "../../../../../checkout-notification-error.log");
          const errMessage = err instanceof Error ? err.message : String(err);
          const errStack = err instanceof Error ? err.stack : "";
          fs.appendFileSync(logPath, `${new Date().toISOString()} - Failed to create admin notification: ${errMessage}\n${errStack}\n\n`);
        } catch (logErr) {
          console.error("Failed to write checkout notification error to file:", logErr);
        }
      }

      // 10. Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: data.cartId },
      });

      // 11. Clear cart addresses and shipping info
      await tx.shoppingCart.update({
        where: { id: data.cartId },
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
          email: null,
        },
      });

      return {
        orderId: order.id,
        orderNo: order.orderNo,
        checkoutId: data.checkoutId,
        paymentIntentId: data.paymentIntentId,
        totalAmount: data.totals.total,
        currency: data.currency,
        status: "paid",
        createdAt: order.createdAt,
        items: orderItems,
      };
    });
  }
}

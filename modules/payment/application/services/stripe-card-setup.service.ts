import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { StripeProvider } from "../../infra/payment-providers/stripe.provider";
import { PaymentMethodService } from "../../../user-management/application/services/payment-method.service";
import { PaymentMethodType } from "../../../user-management/domain/value-objects/payment-method-type.vo";
import type { PaymentMethodDTO } from "../../../user-management/domain/entities/payment-method.entity";

/**
 * Bridges the Stripe SDK with the user-management `PaymentMethodService`
 * so cards are saved through a PCI-compliant flow:
 *
 * 1. `createSetupIntent(userId, email)` — finds-or-creates the user's
 *    Stripe Customer (lazy population of `users.stripe_customer_id`),
 *    creates a SetupIntent on that customer, returns `client_secret`.
 *    The frontend confirms the SetupIntent with Stripe Elements; the
 *    card never touches our servers.
 *
 * 2. `attachPaymentMethod(userId, paymentMethodId, isDefault)` — after
 *    Elements has confirmed the SetupIntent and Stripe attached the
 *    card to the customer, the frontend posts the resulting
 *    `pm_…` ID. We retrieve the card details from Stripe (don't trust
 *    the browser) and persist them via the existing
 *    `PaymentMethodService.addPaymentMethod`, storing the `pm_…` ID
 *    in `providerRef`.
 *
 * Future PaymentIntents (checkout) can be created against the same
 * `customer.id` + `payment_method.id` for one-tap purchases.
 */
export class StripeCardSetupService {
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly stripeProvider: StripeProvider,
    private readonly paymentMethodService: PaymentMethodService,
  ) {
    // Reuse the SDK instance owned by StripeProvider so we don't
    // double-instantiate (each `new Stripe()` opens its own keepalive pool).
    this.stripe = (stripeProvider as unknown as { stripe: Stripe }).stripe;
  }

  /**
   * Find-or-create the user's Stripe Customer and return the ID. Persists
   * the new ID to `users.stripe_customer_id` on first call.
   */
  private async ensureStripeCustomer(
    userId: string,
    email: string,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, firstName: true, lastName: true },
    });
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: user.email ?? email,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        undefined,
      metadata: { userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /** Create a SetupIntent and return its `client_secret` for the browser. */
  async createSetupIntent(params: {
    userId: string;
    email: string;
  }): Promise<{ clientSecret: string; customerId: string }> {
    const customerId = await this.ensureStripeCustomer(
      params.userId,
      params.email,
    );

    const intent = await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { userId: params.userId },
    });

    if (!intent.client_secret) {
      throw new Error("Stripe SetupIntent did not return a client secret");
    }

    return { clientSecret: intent.client_secret, customerId };
  }

  /**
   * Persist a confirmed PaymentMethod. Called after the frontend has
   * successfully run `stripe.confirmCardSetup(clientSecret, …)`.
   *
   * We re-fetch the PaymentMethod from Stripe (rather than trust the
   * client) and verify it belongs to the user's Stripe Customer.
   */
  async attachPaymentMethod(params: {
    userId: string;
    stripePaymentMethodId: string;
    isDefault?: boolean;
    billingAddressId?: string;
  }): Promise<PaymentMethodDTO> {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      throw new Error(
        "User has no Stripe customer — call createSetupIntent first.",
      );
    }

    const pm = await this.stripe.paymentMethods.retrieve(
      params.stripePaymentMethodId,
    );

    // Reject mismatches: the SetupIntent attaches the PM to the customer,
    // so any PM not belonging to this customer is either unattached or
    // belongs to someone else — never persist either case.
    if (pm.customer && pm.customer !== user.stripeCustomerId) {
      throw new Error("Stripe payment method does not belong to this user");
    }
    if (!pm.customer) {
      // Defensive attach (SetupIntent should have already done this).
      await this.stripe.paymentMethods.attach(pm.id, {
        customer: user.stripeCustomerId,
      });
    }

    if (pm.type !== "card" || !pm.card) {
      throw new Error(`Unsupported Stripe payment method type: ${pm.type}`);
    }

    return this.paymentMethodService.addPaymentMethod({
      userId: params.userId,
      type: PaymentMethodType.CARD,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      providerRef: pm.id,
      billingAddressId: params.billingAddressId,
      isDefault: params.isDefault,
    });
  }
}

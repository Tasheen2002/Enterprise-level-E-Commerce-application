import Stripe from "stripe";
import { StripeConfig } from "../config/stripe.config";

export interface CreatePaymentIntentParams {
  amount: number; // in smallest currency unit (e.g. cents)
  currency: string;
  orderId: string;
  intentId: string;
  customerId?: string;
  customerEmail?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  stripeIntentId?: string;
  status?: string;
  error?: string;
}

export interface StripeRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

export class StripeProvider {
  private stripe: Stripe;
  private currency: string;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2026-02-25.clover",
    });
    this.currency = config.currency || "usd";
  }

  /**
   * Create a Stripe PaymentIntent.
   * Amount must be in the smallest currency unit (cents for USD).
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<StripePaymentIntentResult> {
    try {
      const intent = await this.stripe.paymentIntents.create(
        {
          amount: Math.round(params.amount * 100), // convert to cents
          currency: params.currency || this.currency,
          metadata: {
            orderId: params.orderId,
            intentId: params.intentId,
            ...params.metadata,
          },
          receipt_email: params.customerEmail,
        },
        params.idempotencyKey
          ? { idempotencyKey: params.idempotencyKey }
          : undefined,
      );

      return {
        success: true,
        clientSecret: intent.client_secret ?? undefined,
        stripeIntentId: intent.id,
        status: intent.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create Stripe payment intent",
      };
    }
  }

  async retrievePaymentIntent(
    stripeIntentId: string,
  ): Promise<StripePaymentIntentResult> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(stripeIntentId);
      return {
        success: true,
        clientSecret: intent.client_secret ?? undefined,
        stripeIntentId: intent.id,
        status: intent.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to retrieve Stripe payment intent",
      };
    }
  }

  /**
   * Refund a captured payment.
   * Amount is optional (full refund if omitted). Amount in main unit (e.g. dollars).
   */
  async refundPayment(
    stripeIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason,
  ): Promise<StripeRefundResult> {
    try {
      const params: Stripe.RefundCreateParams = {
        payment_intent: stripeIntentId,
        reason: reason || "requested_by_customer",
      };
      if (amount !== undefined) {
        params.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(params);
      return {
        success: true,
        refundId: refund.id,
        status: refund.status ?? undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Stripe refund failed",
      };
    }
  }

  /**
   * Cancel (void) an uncaptured PaymentIntent.
   */
  async cancelPaymentIntent(
    stripeIntentId: string,
  ): Promise<StripePaymentIntentResult> {
    try {
      const intent = await this.stripe.paymentIntents.cancel(stripeIntentId);
      return {
        success: true,
        stripeIntentId: intent.id,
        status: intent.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to cancel Stripe payment intent",
      };
    }
  }

  /**
   * Validate an incoming Stripe webhook signature.
   * Returns the parsed Stripe Event on success, throws on failure.
   */
  constructWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }
}

export function createStripeProvider(config: StripeConfig): StripeProvider {
  return new StripeProvider(config);
}

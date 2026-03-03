import { FastifyRequest, FastifyReply } from "fastify";
import { StripeProvider } from "../../payment-providers/stripe.provider";
import { getStripeConfig } from "../../config/stripe.config";
import { PaymentService } from "../../../application/services/payment.service";

export class StripeWebhookController {
  private stripeProvider: StripeProvider;
  private webhookSecret: string;

  constructor(private readonly paymentService: PaymentService) {
    const config = getStripeConfig();
    this.stripeProvider = new StripeProvider(config);
    this.webhookSecret = config.webhookSecret || "";
  }

  /**
   * Create a Stripe PaymentIntent and return client_secret to frontend.
   *
   * POST /api/payments/stripe/create-intent
   */
  async createIntent(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderId, amount, currency, idempotencyKey } = req.body as any;
      const user = (req as any).user;

      if (!orderId || !amount) {
        return reply.status(400).send({
          success: false,
          error: "orderId and amount are required",
        });
      }

      // Create payment intent in our system
      const paymentIntent = await this.paymentService.createPaymentIntent({
        orderId,
        provider: "stripe",
        amount,
        currency: currency || "usd",
        idempotencyKey,
        userId: user?.userId,
      });

      // Create PaymentIntent on Stripe
      const stripeResult = await this.stripeProvider.createPaymentIntent({
        amount,
        currency: currency || "usd",
        orderId,
        intentId: paymentIntent.intentId,
        customerEmail: user?.email,
        idempotencyKey,
      });

      if (!stripeResult.success) {
        return reply.status(400).send({
          success: false,
          error: stripeResult.error || "Failed to create Stripe payment intent",
        });
      }

      // Persist the Stripe intent ID as clientSecret reference
      if (stripeResult.stripeIntentId) {
        await this.paymentService.updatePaymentIntent(paymentIntent.intentId, {
          clientSecret: stripeResult.stripeIntentId,
        });
      }

      return reply.status(201).send({
        success: true,
        data: {
          intentId: paymentIntent.intentId,
          clientSecret: stripeResult.clientSecret,
          stripeIntentId: stripeResult.stripeIntentId,
        },
      });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle Stripe webhook events.
   *
   * POST /api/payments/stripe/webhook
   * Requires raw body (configured in Fastify as Buffer).
   */
  async handleWebhook(req: FastifyRequest, reply: FastifyReply) {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const rawBody = (req as any).rawBody as Buffer;

      if (!signature) {
        return reply.status(400).send({
          success: false,
          error: "Missing Stripe-Signature header",
        });
      }

      // Verify webhook signature when webhook secret is configured
      let event: any;
      if (this.webhookSecret) {
        try {
          event = this.stripeProvider.constructWebhookEvent(
            rawBody,
            signature,
            this.webhookSecret,
          );
        } catch (err: any) {
          req.log.warn(`Stripe webhook signature validation failed: ${err.message}`);
          return reply.status(401).send({
            success: false,
            error: "Invalid webhook signature",
          });
        }
      } else {
        // Without webhook secret (development), parse body directly
        req.log.warn(
          "Stripe webhook signature validation skipped (STRIPE_WEBHOOK_SECRET not configured)",
        );
        event = req.body;
      }

      req.log.info(`Stripe webhook received: ${event.type}`);

      const stripeObject = event.data?.object;

      switch (event.type) {
        case "payment_intent.succeeded": {
          const stripeIntentId = stripeObject?.id;
          if (!stripeIntentId) break;

          // Find our intent by Stripe intent ID (stored in clientSecret field)
          const paymentIntent =
            await this.paymentService.getPaymentIntentByClientSecret(
              stripeIntentId,
            );

          if (!paymentIntent) {
            req.log.error(
              `Stripe webhook: PaymentIntent not found for Stripe ID ${stripeIntentId}`,
            );
            break;
          }

          const intentId = paymentIntent.intentId;
          const currentStatus = paymentIntent.status;

          if (currentStatus !== "captured") {
            try {
              await this.paymentService.authorizePayment({
                intentId,
                pspReference: stripeIntentId,
              });
            } catch (err: any) {
              req.log.warn(`Authorize step skipped: ${err.message}`);
            }

            await this.paymentService.capturePayment(intentId, stripeIntentId);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const stripeIntentId = stripeObject?.id;
          if (!stripeIntentId) break;

          const paymentIntent =
            await this.paymentService.getPaymentIntentByClientSecret(
              stripeIntentId,
            );

          if (paymentIntent) {
            const reason =
              stripeObject?.last_payment_error?.message || "Payment failed";
            await this.paymentService.failPayment(
              paymentIntent.intentId,
              reason,
            );
          }
          break;
        }

        case "charge.refunded": {
          req.log.info("Stripe charge.refunded event received");
          // Refund state updates are handled via explicit refund API calls
          break;
        }

        default:
          req.log.info(`Unhandled Stripe webhook event: ${event.type}`);
      }

      return reply.status(200).send({ received: true });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Webhook processing failed",
      });
    }
  }
}

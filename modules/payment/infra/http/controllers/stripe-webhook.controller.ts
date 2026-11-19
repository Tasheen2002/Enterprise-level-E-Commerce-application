import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { StripeProvider } from "../../payment-providers/stripe.provider";
import type { StripeConfig } from "../../config/stripe.config";
import { PaymentService } from "../../../application/services/payment.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { CreateStripeIntentBody } from "../validation/payment-intent.schema";

type RawBodyRequest = FastifyRequest & { rawBody: Buffer };

type StripeEventObject = { id?: string; last_payment_error?: { message?: string } };
type StripeWebhookEvent = { type: string; data: { object: StripeEventObject } };

export class StripeWebhookController {
  private readonly stripeProvider: StripeProvider;
  private readonly webhookSecret: string | undefined;

  /** Configuration comes from validated server config; nothing is read from process.env. */
  constructor(
    private readonly paymentService: PaymentService,
    config: StripeConfig,
  ) {
    this.stripeProvider = new StripeProvider(config);
    this.webhookSecret = config.webhookSecret;
  }

  async createIntent(
    req: AuthenticatedRequest<{ Body: CreateStripeIntentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId, checkoutId, amount, currency, idempotencyKey } = req.body;

      const paymentIntent = await this.paymentService.createPaymentIntent({
        orderId,
        checkoutId,
        provider: "stripe",
        amount,
        currency: currency || "usd",
        idempotencyKey,
        userId: req.user?.userId,
        guestToken: req.user?.userId
          ? undefined
          : ((req.headers["x-guest-token"] ?? req.headers["guest-token"]) as string | undefined),
      });

      const stripeResult = await this.stripeProvider.createPaymentIntent({
        amount,
        currency: currency || "usd",
        orderId: orderId || checkoutId || "",
        intentId: paymentIntent.id,
        customerEmail: req.user?.email,
        idempotencyKey,
      });

      if (!stripeResult.success) {
        return ResponseHelper.badRequest(
          reply,
          stripeResult.error || "Failed to create Stripe payment intent",
        );
      }

      if (stripeResult.stripeIntentId) {
        await this.paymentService.updatePaymentIntent(paymentIntent.id, {
          clientSecret: stripeResult.stripeIntentId,
        });
      }

      return ResponseHelper.created(reply, "Stripe payment intent created", {
        intentId: paymentIntent.id,
        clientSecret: stripeResult.clientSecret,
        stripeIntentId: stripeResult.stripeIntentId,
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async handleWebhook(req: RawBodyRequest, reply: FastifyReply) {
    try {
      // Fail closed: an unsigned event could mark any payment captured.
      if (!this.webhookSecret) {
        req.log.error("Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured");
        return reply.status(503).send({
          success: false,
          statusCode: 503,
          message: "Stripe webhook signing secret is not configured",
          code: "WEBHOOK_NOT_CONFIGURED",
        });
      }

      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string" || signature.length === 0) {
        return ResponseHelper.badRequest(reply, "Missing Stripe-Signature header");
      }
      if (!req.rawBody) {
        return ResponseHelper.badRequest(reply, "Webhook payload must be JSON");
      }

      let event: StripeWebhookEvent;
      try {
        event = this.stripeProvider.constructWebhookEvent(
          req.rawBody,
          signature,
          this.webhookSecret,
        ) as unknown as StripeWebhookEvent;
      } catch (err: unknown) {
        req.log.warn(
          `Stripe webhook signature validation failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        // Stripe expects 400 for signature verification failures (not an HTTP auth challenge).
        return ResponseHelper.badRequest(reply, "Invalid webhook signature");
      }

      req.log.info(`Stripe webhook received: ${event.type}`);

      const stripeObject = event.data?.object;

      switch (event.type) {
        case "payment_intent.succeeded": {
          const stripeIntentId = stripeObject?.id;
          if (!stripeIntentId) break;

          const paymentIntent =
            await this.paymentService.getPaymentIntentByClientSecret(stripeIntentId);

          if (!paymentIntent) {
            req.log.error(
              `Stripe webhook: PaymentIntent not found for Stripe ID ${stripeIntentId}`,
            );
            break;
          }

          const intentId = paymentIntent.id;
          const currentStatus = paymentIntent.status;

          if (currentStatus !== "captured") {
            try {
              await this.paymentService.authorizePayment({
                intentId,
                pspReference: stripeIntentId,
              });
            } catch (err: unknown) {
              req.log.warn(
                `Authorize step skipped: ${err instanceof Error ? err.message : String(err)}`,
              );
            }

            await this.paymentService.capturePayment(intentId, stripeIntentId);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const stripeIntentId = stripeObject?.id;
          if (!stripeIntentId) break;

          const paymentIntent =
            await this.paymentService.getPaymentIntentByClientSecret(stripeIntentId);

          if (paymentIntent) {
            const reason = stripeObject?.last_payment_error?.message || "Payment failed";
            await this.paymentService.failPayment(paymentIntent.id, reason);
          }
          break;
        }

        case "charge.refunded": {
          req.log.info("Stripe charge.refunded event received");
          break;
        }

        default:
          req.log.info(`Unhandled Stripe webhook event: ${event.type}`);
      }

      return ResponseHelper.ok(reply, "Webhook received", { received: true });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}

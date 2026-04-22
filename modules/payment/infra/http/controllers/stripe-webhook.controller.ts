import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { StripeProvider } from "../../payment-providers/stripe.provider";
import { getStripeConfig } from "../../config/stripe.config";
import { PaymentService } from "../../../application/services/payment.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { CreateStripeIntentBody } from "../validation/payment-intent.schema";

type RawBodyRequest = FastifyRequest & { rawBody: Buffer };

type StripeEventObject = { id?: string; last_payment_error?: { message?: string } };
type StripeWebhookEvent = { type: string; data: { object: StripeEventObject } };

export class StripeWebhookController {
  private stripeProvider: StripeProvider;
  private webhookSecret: string;

  constructor(private readonly paymentService: PaymentService) {
    const config = getStripeConfig();
    this.stripeProvider = new StripeProvider(config);
    this.webhookSecret = config.webhookSecret || "";
  }

  async createIntent(
    req: AuthenticatedRequest<{ Body: CreateStripeIntentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId, amount, currency, idempotencyKey } = req.body;

      const paymentIntent = await this.paymentService.createPaymentIntent({
        orderId,
        provider: "stripe",
        amount,
        currency: currency || "usd",
        idempotencyKey,
        userId: req.user.userId,
      });

      const stripeResult = await this.stripeProvider.createPaymentIntent({
        amount,
        currency: currency || "usd",
        orderId,
        intentId: paymentIntent.id,
        customerEmail: req.user.email,
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
      const signature = req.headers["stripe-signature"] as string;
      const rawBody = req.rawBody;

      if (!signature) {
        return ResponseHelper.badRequest(reply, "Missing Stripe-Signature header");
      }

      let event: StripeWebhookEvent;
      if (this.webhookSecret) {
        try {
          event = this.stripeProvider.constructWebhookEvent(
            rawBody,
            signature,
            this.webhookSecret,
          ) as unknown as StripeWebhookEvent;
        } catch (err: unknown) {
          req.log.warn(
            `Stripe webhook signature validation failed: ${err instanceof Error ? err.message : String(err)}`,
          );
          return ResponseHelper.unauthorized(reply, "Invalid webhook signature");
        }
      } else {
        req.log.warn(
          "Stripe webhook signature validation skipped (STRIPE_WEBHOOK_SECRET not configured)",
        );
        event = req.body as StripeWebhookEvent;
      }

      req.log.info(`Stripe webhook received: ${event.type}`);

      const stripeObject = event.data?.object;

      switch (event.type) {
        case "payment_intent.succeeded": {
          const stripeIntentId = stripeObject?.id;
          if (!stripeIntentId) break;

          const paymentIntent = await this.paymentService.getPaymentIntentByClientSecret(
            stripeIntentId,
          );

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
              req.log.warn(`Authorize step skipped: ${err instanceof Error ? err.message : String(err)}`);
            }

            await this.paymentService.capturePayment(intentId, stripeIntentId);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const stripeIntentId = stripeObject?.id;
          if (!stripeIntentId) break;

          const paymentIntent = await this.paymentService.getPaymentIntentByClientSecret(
            stripeIntentId,
          );

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

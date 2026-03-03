import { FastifyInstance } from "fastify";
import {
  PaymentIntentController,
  PaymentTransactionController,
  PaymentWebhookController,
  BnplTransactionController,
  GiftCardController,
  GiftCardTransactionController,
  PromotionController,
  PromotionUsageController,
  LoyaltyProgramController,
  LoyaltyAccountController,
  LoyaltyTransactionController,
} from "../controllers";
import { StripeWebhookController } from "../controllers/stripe-webhook.controller";
import { isStripeConfigured } from "../../config/stripe.config";
import {
  PaymentService,
  BnplTransactionService,
  GiftCardService,
  PromotionService,
  PaymentWebhookService,
  LoyaltyService,
  LoyaltyTransactionService,
} from "../../../application/services";
import { registerPaymentIntentRoutes } from "./payment-intent.routes";
import { registerPaymentTransactionRoutes } from "./payment-transaction.routes";
import { registerBnplTransactionRoutes } from "./bnpl-transaction.routes";
import { registerGiftCardRoutes } from "./gift-card.routes";
import { registerPromotionRoutes } from "./promotion.routes";
import { registerWebhookRoutes } from "./webhook.routes";
import { registerLoyaltyRoutes } from "./loyalty.routes";

export interface PaymentLoyaltyRouteServices {
  paymentService: PaymentService;
  bnplService: BnplTransactionService;
  giftCardService: GiftCardService;
  promotionService: PromotionService;
  webhookService: PaymentWebhookService;
  loyaltyService: LoyaltyService;
  loyaltyTxnService: LoyaltyTransactionService;
}

export async function registerPaymentLoyaltyRoutes(
  fastify: FastifyInstance,
  services: PaymentLoyaltyRouteServices,
): Promise<void> {
  const paymentIntentController = new PaymentIntentController(services.paymentService);
  const paymentTransactionController = new PaymentTransactionController(services.paymentService);
  const paymentWebhookController = new PaymentWebhookController(services.webhookService);
  const bnplController = new BnplTransactionController(services.bnplService);
  const giftCardController = new GiftCardController(services.giftCardService);
  const giftCardTxnController = new GiftCardTransactionController(services.giftCardService);
  const promotionController = new PromotionController(services.promotionService);
  const promotionUsageController = new PromotionUsageController(services.promotionService);
  const loyaltyProgramController = new LoyaltyProgramController(services.loyaltyService);
  const loyaltyAccountController = new LoyaltyAccountController(services.loyaltyService);
  const loyaltyTxnController = new LoyaltyTransactionController(
    services.loyaltyService,
    services.loyaltyTxnService,
  );

  if (!isStripeConfigured()) {
    fastify.log.warn(
      "Stripe not configured (STRIPE_SECRET_KEY missing) — skipping Stripe routes",
    );
  }

  const stripeController = isStripeConfigured()
    ? new StripeWebhookController(services.paymentService)
    : null;

  await fastify.register(
    async (instance) => {
      await registerPaymentIntentRoutes(instance, paymentIntentController);
      await registerPaymentTransactionRoutes(instance, paymentTransactionController);
      await registerBnplTransactionRoutes(instance, bnplController);
      await registerGiftCardRoutes(instance, giftCardController, giftCardTxnController);
      await registerPromotionRoutes(instance, promotionController, promotionUsageController);
      if (stripeController) {
        await registerWebhookRoutes(instance, paymentWebhookController, stripeController);
      }
      await registerLoyaltyRoutes(
        instance,
        loyaltyProgramController,
        loyaltyAccountController,
        loyaltyTxnController,
      );
    },
    { prefix: "/api/v1" },
  );
}

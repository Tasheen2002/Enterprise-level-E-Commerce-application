import { FastifyInstance } from "fastify";
import {
  PaymentIntentController,
  PaymentWebhookController,
  BnplTransactionController,
  GiftCardController,
  PromotionController,
  StripeWebhookController,
} from "../controllers";
import { LoyaltyController } from "../../../../loyalty/infra/http/controllers/loyalty.controller";
import { registerPaymentIntentRoutes } from "./payment-intent.routes";
import { registerBnplTransactionRoutes } from "./bnpl-transaction.routes";
import { registerGiftCardRoutes } from "./gift-card.routes";
import { registerPromotionRoutes } from "./promotion.routes";
import { registerWebhookRoutes } from "./webhook.routes";
import { loyaltyRoutes } from "../../../../loyalty/infra/http/routes/loyalty.routes";

export interface PaymentRouteServices {
  paymentIntentController: PaymentIntentController;
  paymentWebhookController: PaymentWebhookController;
  bnplController: BnplTransactionController;
  giftCardController: GiftCardController;
  promotionController: PromotionController;
  stripeController: StripeWebhookController | null;
  loyaltyController: LoyaltyController;
}

export async function registerPaymentRoutes(
  fastify: FastifyInstance,
  controllers: PaymentRouteServices,
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await registerPaymentIntentRoutes(instance, controllers.paymentIntentController);
      await registerBnplTransactionRoutes(instance, controllers.bnplController);
      await registerGiftCardRoutes(instance, controllers.giftCardController);
      await registerPromotionRoutes(instance, controllers.promotionController);
      if (controllers.stripeController) {
        await registerWebhookRoutes(instance, controllers.paymentWebhookController, controllers.stripeController);
      }
      await loyaltyRoutes(instance, controllers.loyaltyController);
    },
    { prefix: "/api/v1" },
  );
}

import { FastifyInstance } from "fastify";
import {
  PaymentIntentController,
  PaymentWebhookController,
  BnplTransactionController,
  GiftCardController,
  PromotionController,
} from "../controllers";
import { LoyaltyController } from "../../../../loyalty/infra/http/controllers/loyalty.controller";
import { StripeWebhookController } from "../controllers/stripe-webhook.controller";
import { isStripeConfigured } from "../../config/stripe.config";
import {
  PaymentService,
  BnplTransactionService,
  GiftCardService,
  PromotionService,
  PaymentWebhookService,
} from "../../../application/services";
import {
  CreatePaymentIntentHandler,
  ProcessPaymentHandler,
  RefundPaymentHandler,
  VoidPaymentHandler,
  CreateBnplTransactionHandler,
  ProcessBnplPaymentHandler,
  CreateGiftCardHandler,
  RedeemGiftCardHandler,
  CreatePromotionHandler,
  ApplyPromotionHandler,
  RecordPromotionUsageHandler,
  ProcessWebhookEventHandler,
} from "../../../application/commands";
import {
  GetPaymentIntentHandler,
  GetPaymentTransactionsHandler,
  GetBnplTransactionsHandler,
  GetGiftCardBalanceHandler,
  GetGiftCardTransactionsHandler,
  GetActivePromotionsHandler,
  GetPromotionUsageHandler,
  GetWebhookEventsHandler,
} from "../../../application/queries";
import { LoyaltyService } from "../../../../loyalty/application/services/loyalty.service";
import { LoyaltyTransactionService } from "../../../../loyalty/application/services/loyalty-transaction.service";
import { ILoyaltyProgramRepository } from "../../../../loyalty/domain/repositories/loyalty-program.repository";
import {
  CreateLoyaltyProgramHandler,
  AwardLoyaltyPointsHandler,
  RedeemLoyaltyPointsHandler,
  AdjustPointsHandler,
} from "../../../../loyalty/application/commands";
import {
  GetLoyaltyProgramsHandler,
  GetLoyaltyAccountHandler,
  GetLoyaltyTransactionsHandler,
} from "../../../../loyalty/application/queries";
import { registerPaymentIntentRoutes } from "./payment-intent.routes";
import { registerBnplTransactionRoutes } from "./bnpl-transaction.routes";
import { registerGiftCardRoutes } from "./gift-card.routes";
import { registerPromotionRoutes } from "./promotion.routes";
import { registerWebhookRoutes } from "./webhook.routes";
import { registerLoyaltyRoutes } from "../../../../loyalty/infra/http/routes";

export interface PaymentRouteServices {
  paymentService: PaymentService;
  bnplService: BnplTransactionService;
  giftCardService: GiftCardService;
  promotionService: PromotionService;
  webhookService: PaymentWebhookService;
  loyaltyService: LoyaltyService;
  loyaltyTxnService: LoyaltyTransactionService;
  loyaltyProgramRepository: ILoyaltyProgramRepository;
}

export async function registerPaymentRoutes(
  fastify: FastifyInstance,
  services: PaymentRouteServices,
): Promise<void> {
  const paymentIntentController = new PaymentIntentController(
    new CreatePaymentIntentHandler(services.paymentService),
    new ProcessPaymentHandler(services.paymentService),
    new RefundPaymentHandler(services.paymentService),
    new VoidPaymentHandler(services.paymentService),
    new GetPaymentIntentHandler(services.paymentService),
    new GetPaymentTransactionsHandler(services.paymentService),
  );
  const paymentWebhookController = new PaymentWebhookController(
    new ProcessWebhookEventHandler(services.webhookService),
    new GetWebhookEventsHandler(services.webhookService),
  );
  const bnplController = new BnplTransactionController(
    new CreateBnplTransactionHandler(services.bnplService),
    new ProcessBnplPaymentHandler(services.bnplService),
    new GetBnplTransactionsHandler(services.bnplService),
  );
  const giftCardController = new GiftCardController(
    new CreateGiftCardHandler(services.giftCardService),
    new RedeemGiftCardHandler(services.giftCardService),
    new GetGiftCardBalanceHandler(services.giftCardService),
    new GetGiftCardTransactionsHandler(services.giftCardService),
  );
  const promotionController = new PromotionController(
    new CreatePromotionHandler(services.promotionService),
    new ApplyPromotionHandler(services.promotionService),
    new GetActivePromotionsHandler(services.promotionService),
    new RecordPromotionUsageHandler(services.promotionService),
    new GetPromotionUsageHandler(services.promotionService),
  );
  const loyaltyController = new LoyaltyController(
    new CreateLoyaltyProgramHandler(services.loyaltyProgramRepository),
    new GetLoyaltyProgramsHandler(services.loyaltyProgramRepository),
    new GetLoyaltyAccountHandler(services.loyaltyService),
    new AwardLoyaltyPointsHandler(services.loyaltyService),
    new RedeemLoyaltyPointsHandler(services.loyaltyService),
    new AdjustPointsHandler(services.loyaltyService),
    new GetLoyaltyTransactionsHandler(services.loyaltyTxnService),
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
      await registerBnplTransactionRoutes(instance, bnplController);
      await registerGiftCardRoutes(instance, giftCardController);
      await registerPromotionRoutes(instance, promotionController);
      if (stripeController) {
        await registerWebhookRoutes(instance, paymentWebhookController, stripeController);
      }
      await registerLoyaltyRoutes(instance, loyaltyController);
    },
    { prefix: "/api/v1" },
  );
}

import { FastifyInstance } from "fastify";
import { LoyaltyController } from "../controllers/loyalty.controller";
import { loyaltyRoutes } from "./loyalty.routes";

export interface LoyaltyRouteServices {
  loyaltyController: LoyaltyController;
}

export async function registerLoyaltyRoutes(
  fastify: FastifyInstance,
  controllers: LoyaltyRouteServices,
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await loyaltyRoutes(instance, controllers.loyaltyController);
    },
    { prefix: "/api/v1" },
  );
}

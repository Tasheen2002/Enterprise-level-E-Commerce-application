import { FastifyInstance } from "fastify";
import { CartController } from "../controllers/cart.controller";
import { ReservationController } from "../controllers/reservation.controller";
import { CheckoutController } from "../controllers/checkout.controller";
import { cartRoutes } from "./cart.routes";
import { checkoutRoutes } from "./checkout.routes";
import { reservationRoutes } from "./reservation.routes";

export async function registerCartModuleRoutes(
  fastify: FastifyInstance,
  controllers: {
    cartController: CartController;
    reservationController: ReservationController;
    checkoutController: CheckoutController;
  },
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await cartRoutes(instance, controllers.cartController);
      await checkoutRoutes(instance, controllers.checkoutController);
      await reservationRoutes(instance, controllers.reservationController);
    },
    { prefix: "/api/v1" },
  );
}

import { FastifyInstance } from "fastify";
import { CartController } from "../controllers/cart.controller";
import { ReservationController } from "../controllers/reservation.controller";
import { CheckoutController } from "../controllers/checkout.controller";
import { registerCartRoutes } from "./cart.routes";
import { registerCheckoutRoutes } from "./checkout.routes";
import { registerReservationRoutes } from "./reservation.routes";

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
      await registerCartRoutes(instance, controllers.cartController);
      await registerCheckoutRoutes(instance, controllers.checkoutController);
      await registerReservationRoutes(instance, controllers.reservationController);
    },
    { prefix: "/api/v1" },
  );
}

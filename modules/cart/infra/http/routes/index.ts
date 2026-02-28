import { FastifyInstance } from "fastify";
import { CartController } from "../controllers/cart.controller";
import { ReservationController } from "../controllers/reservation.controller";
import { CheckoutController } from "../controllers/checkout.controller";
import { CartManagementService } from "../../../application/services/cart-management.service";
import { ReservationService } from "../../../application/services/reservation.service";
import { CheckoutService } from "../../../application/services/checkout.service";
import { CheckoutOrderService } from "../../../application/services/checkout-order.service";
import { registerCartRoutes } from "./cart.routes";
import { registerCheckoutRoutes } from "./checkout.routes";
import { registerReservationRoutes } from "./reservation.routes";

export interface CartRouteServices {
  cartManagementService: CartManagementService;
  reservationService: ReservationService;
  checkoutService: CheckoutService;
  checkoutOrderService: CheckoutOrderService;
}

export async function registerCartModuleRoutes(
  fastify: FastifyInstance,
  services: CartRouteServices,
): Promise<void> {
  const cartController = new CartController(services.cartManagementService);
  const reservationController = new ReservationController(
    services.reservationService,
  );
  const checkoutController = new CheckoutController(
    services.checkoutService,
    services.checkoutOrderService,
  );

  await fastify.register(
    async (instance) => {
      await registerCartRoutes(instance, cartController);
      await registerCheckoutRoutes(instance, checkoutController);
      await registerReservationRoutes(instance, reservationController);
    },
    { prefix: "/api/v1" },
  );
}

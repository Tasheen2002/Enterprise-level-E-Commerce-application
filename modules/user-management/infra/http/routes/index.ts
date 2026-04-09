import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { AuthController } from "../controllers/auth.controller";
import { ProfileController } from "../controllers/profile.controller";
import { AddressesController } from "../controllers/addresses.controller";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { UsersController } from "../controllers/users.controller";
import { registerAuthRoutes } from "./auth.routes";
import { registerProfileRoutes } from "./profile.routes";
import { registerAddressRoutes } from "./addresses.routes";
import { registerPaymentMethodRoutes } from "./payment-methods.routes";
import { registerUserRoutes } from "./users.routes";

export async function registerUserManagementRoutes(
  fastify: FastifyInstance,
  controllers: {
    authController: AuthController;
    profileController: ProfileController;
    addressesController: AddressesController;
    paymentMethodsController: PaymentMethodsController;
    usersController: UsersController;
  },
  prisma: PrismaClient,
) {
  await fastify.register(
    async (instance) => {
      // Public auth routes
      await registerAuthRoutes(instance, controllers.authController);

      // Protected routes — require a valid JWT
      await instance.register(async (protected_) => {
        protected_.addHook("onRequest", async (request) => {
          await fastify.authenticate(request);
        });

        await registerProfileRoutes(protected_, controllers.profileController);
        await registerAddressRoutes(
          protected_,
          controllers.addressesController,
        );
        await registerPaymentMethodRoutes(
          protected_,
          controllers.paymentMethodsController,
        );
        await registerUserRoutes(protected_, controllers.usersController);
      });
    },
    { prefix: "/api/v1" },
  );
}

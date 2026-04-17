import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import { ProfileController } from "../controllers/profile.controller";
import { AddressesController } from "../controllers/addresses.controller";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { UsersController } from "../controllers/users.controller";
import { authRoutes } from "./auth.routes";
import { profileRoutes } from "./profile.routes";
import { addressRoutes } from "./addresses.routes";
import { paymentMethodRoutes } from "./payment-methods.routes";
import { userRoutes } from "./users.routes";

export async function registerUserManagementRoutes(
  fastify: FastifyInstance,
  controllers: {
    authController: AuthController;
    profileController: ProfileController;
    addressesController: AddressesController;
    paymentMethodsController: PaymentMethodsController;
    usersController: UsersController;
  },
): Promise<void> {
  await fastify.register(
    async (instance) => {
      // Public auth routes
      await authRoutes(instance, controllers.authController);

      // Protected routes — require a valid JWT
      await instance.register(async (protected_) => {
        protected_.addHook("onRequest", async (request) => {
          await fastify.authenticate(request);
        });

        await profileRoutes(protected_, controllers.profileController);
        await addressRoutes(
          protected_,
          controllers.addressesController,
        );
        await paymentMethodRoutes(
          protected_,
          controllers.paymentMethodsController,
        );
        await userRoutes(protected_, controllers.usersController);
      });
    },
    { prefix: "/api/v1" },
  );
}

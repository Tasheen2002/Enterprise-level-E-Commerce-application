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

export interface UserManagementControllers {
  authController: AuthController;
  profileController: ProfileController;
  addressesController: AddressesController;
  paymentMethodsController: PaymentMethodsController;
  usersController: UsersController;
}

export async function registerUserManagementRoutes(
  fastify: FastifyInstance,
  controllers: UserManagementControllers,
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await authRoutes(instance, controllers.authController);
      await profileRoutes(instance, controllers.profileController);
      await addressRoutes(instance, controllers.addressesController);
      await paymentMethodRoutes(instance, controllers.paymentMethodsController);
      await userRoutes(instance, controllers.usersController);
    },
    { prefix: "/api/v1" },
  );
}

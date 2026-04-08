import { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "./auth.routes";
import { registerProfileRoutes } from "./profile.routes";
import { registerAddressRoutes } from "./addresses.routes";
import { registerPaymentMethodRoutes } from "./payment-methods.routes";
import { registerUserRoutes } from "./users.routes";
import { AuthController } from "../controllers/auth.controller";
import { ProfileController } from "../controllers/profile.controller";
import { AddressesController } from "../controllers/addresses.controller";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { UsersController } from "../controllers/users.controller";
import { AuthenticationService } from "../../../application/services/authentication.service";
import { UserProfileService } from "../../../application/services/user-profile.service";
import { AddressManagementService } from "../../../application/services/address-management.service";
import { PaymentMethodService } from "../../../application/services/payment-method.service";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { IAddressRepository } from "../../../domain/repositories/iaddress.repository";

export interface UserManagementRouteServices {
  authService: AuthenticationService;
  profileService: UserProfileService;
  addressService: AddressManagementService;
  paymentMethodService: PaymentMethodService;
  userRepository: IUserRepository;
  addressRepository: IAddressRepository;
}

export async function registerUserManagementRoutes(
  fastify: FastifyInstance,
  services: UserManagementRouteServices,
) {
  // Initialize controllers
  const authController = new AuthController(
    services.authService,
    services.userRepository,
  );
  const profileController = new ProfileController(services.profileService);
  const addressesController = new AddressesController(services.addressService);
  const paymentMethodsController = new PaymentMethodsController(
    services.paymentMethodService,
  );
  const usersController = new UsersController(
    services.profileService,
    services.userRepository,
    services.addressRepository,
  );

  await fastify.register(
    async (instance) => {
      // Public auth routes (register, login, refresh, forgot-password, reset-password, 2fa)
      await registerAuthRoutes(instance, authController);

      // Protected routes — require a valid JWT
      await instance.register(async (protected_) => {
        protected_.addHook("onRequest", async (request) => {
          await fastify.authenticate(request);
        });

        await registerProfileRoutes(protected_, profileController);
        await registerAddressRoutes(protected_, addressesController);
        await registerPaymentMethodRoutes(protected_, paymentMethodsController);
        await registerUserRoutes(protected_, usersController);
      });
    },
    { prefix: "/api/v1" },
  );
}

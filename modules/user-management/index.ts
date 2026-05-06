// modules/user-management/index.ts

// Route registration (used by modules.ts)
export { registerUserManagementRoutes } from "./infra/http/routes/index";

// Domain errors (used by cross-cutting error handlers)
export {
  UserNotFoundError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserBlockedError,
  EmailNotVerifiedError,
  InvalidVerificationTokenError,
  VerificationRateLimitError,
  InvalidPasswordError,
  AddressNotFoundError,
  PaymentMethodNotFoundError,
} from "./domain/errors/user-management.errors";

// Enums (safe to share cross-module)
export { UserRole, UserStatus, ShippingZone } from "./domain/value-objects";

// DTO types only (for cross-module type sharing)
export type { UserDTO } from "./domain/entities/user.entity";
export type { UserProfileDTO } from "./domain/entities/user-profile.entity";
export type { AddressDTO } from "./domain/entities/address.entity";
export type { PaymentMethodDTO } from "./domain/entities/payment-method.entity";

// Value object IDs (if needed cross-module)
export { UserId } from "./domain/value-objects/user-id.vo";
export { AddressId } from "./domain/value-objects/address-id.vo";
export { PaymentMethodId } from "./domain/value-objects/payment-method-id.vo";

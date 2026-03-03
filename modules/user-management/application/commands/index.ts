// Shared Command Types (only export class, not interfaces)
export {
  CommandResult,
  ICommand,
  ICommandHandler,
} from "@/api/src/shared/application";

// Export type-only interfaces
export type { RegisterUserCommand } from "./register-user.command.js";
export type { LoginUserCommand } from "./login-user.command.js";
export type { UpdateProfileCommand } from "./update-profile.command.js";
export type { AddAddressCommand } from "./add-address.command.js";
export type { UpdateAddressCommand } from "./update-address.command.js";
export type { DeleteAddressCommand } from "./delete-address.command.js";
export type { AddPaymentMethodCommand } from "./add-payment-method.command.js";
export type { UpdatePaymentMethodCommand } from "./update-payment-method.command.js";
export type { DeletePaymentMethodCommand } from "./delete-payment-method.command.js";
export type { ChangePasswordCommand } from "./change-password.command.js";
export type { ChangeEmailCommand } from "./change-email.command.js";
export type { InitiatePasswordResetCommand } from "./initiate-password-reset.command.js";
export type { ResetPasswordCommand } from "./reset-password.command.js";
export type { VerifyEmailCommand } from "./verify-email.command.js";
export type { UpdateUserStatusCommand } from "./update-user-status.command.js";
export type { UpdateUserRoleCommand } from "./update-user-role.command.js";
export type { DeleteUserCommand } from "./delete-user.command.js";
export type { ToggleUserEmailVerifiedCommand } from "./toggle-user-email-verified.command.js";

// Export Handler classes (runtime exports)
export { RegisterUserHandler } from "./register-user.command.js";
export { LoginUserHandler } from "./login-user.command.js";
export { UpdateProfileHandler } from "./update-profile.command.js";
export { AddAddressHandler } from "./add-address.command.js";
export { UpdateAddressHandler } from "./update-address.command.js";
export { DeleteAddressHandler } from "./delete-address.command.js";
export { AddPaymentMethodHandler } from "./add-payment-method.command.js";
export { UpdatePaymentMethodHandler } from "./update-payment-method.command.js";
export { DeletePaymentMethodHandler } from "./delete-payment-method.command.js";
export { ChangePasswordHandler } from "./change-password.command.js";
export { ChangeEmailHandler } from "./change-email.command.js";
export { InitiatePasswordResetHandler } from "./initiate-password-reset.command.js";
export { ResetPasswordHandler } from "./reset-password.command.js";
export { VerifyEmailHandler } from "./verify-email.command.js";

export { UpdateUserStatusHandler } from "./update-user-status.command.js";
export { UpdateUserRoleHandler } from "./update-user-role.command.js";
export { DeleteUserHandler } from "./delete-user.command.js";
export { ToggleUserEmailVerifiedHandler } from "./toggle-user-email-verified.command.js";

// Repository implementations
export { UserRepository } from "./user.repository";
export { UserProfileRepository } from "./user-profile.repository";
export { AddressRepository } from "./address.repository";
export { PaymentMethodRepository } from "./payment-method.repository";
export { VerificationTokenRepository } from "./verification-token.repository";
export { VerificationAuditLogRepository } from "./verification-audit-log.repository";
export { VerificationRateLimitRepository } from "./verification-rate-limit.repository";
export { SocialLoginRepository } from "./social-login.repository";

// Export repository interfaces from domain layer
export type { IUserRepository } from "../../../domain/repositories/iuser.repository";
export type { IUserProfileRepository } from "../../../domain/repositories/iuser-profile.repository";
export type { IAddressRepository } from "../../../domain/repositories/iaddress.repository";
export type { IPaymentMethodRepository } from "../../../domain/repositories/ipayment-method.repository";
export type { IVerificationTokenRepository } from "../../../domain/repositories/iverification-token.repository";
export type { IVerificationAuditLogRepository } from "../../../domain/repositories/iverification-audit-log.repository";
export type { IVerificationRateLimitRepository } from "../../../domain/repositories/iverification-rate-limit.repository";
export type { ISocialLoginRepository } from "../../../domain/repositories/isocial-login.repository";

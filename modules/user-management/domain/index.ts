export * from "./entities";
export * from "./repositories";
export * from "./errors";
export * from "./constants";

// Value objects — re-exported explicitly to avoid name collision with the
// Address entity (which is also called `Address`). The VO is exposed under
// the `AddressVO` alias for disambiguation.
export { UserId } from "./value-objects/user-id.vo";
export { AddressId } from "./value-objects/address-id.vo";
export { PaymentMethodId } from "./value-objects/payment-method-id.vo";
export { SocialLoginId } from "./value-objects/social-login-id.vo";
export { Email } from "./value-objects/email.vo";
export { Phone } from "./value-objects/phone.vo";
// Currency is a foundational concept shared across modules; re-exported from core.
export { Currency } from "../../../packages/core/src/domain/value-objects/currency.vo";
export { Locale } from "./value-objects/locale.vo";
export { Address as AddressVO } from "./value-objects/address.vo";
export { AddressType } from "./value-objects/address-type.vo";
// Enums folded into VO files alongside namespace-augmented helper methods
// (canonical pattern, matches existing `PaymentMethodType` / `SocialProvider`
// shape). The single export carries both the enum values (primitive access
// via `Xxx.MEMBER`) and helpers (`Xxx.fromString`, `Xxx.getDisplayName`).
export { UserRole } from "./value-objects/user-role.vo";
export { UserStatus } from "./value-objects/user-status.vo";
export { PaymentMethodType } from "./value-objects/payment-method-type.vo";
export { SocialProvider } from "./value-objects/social-provider.vo";
export { ShippingZone } from "./value-objects/shipping-zone.vo";

// Domain services
export { AddressShippingService, type AddressLabel } from "./services/address-shipping.service";

import { z } from "zod";
import type * as Auth from "../src/auth";
import type * as User from "../src/user";
import { paginationQuerySchema, paginatedResponseShape } from "../src";
import type { PaginationQuery } from "../src/common";
import type { UpdateProfileBody } from "../../../modules/user-management/infra/http/validation/profile.schema";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type SameProfileFacade = Assert<Equal<Auth.UpdateProfileRequest, User.UpdateProfileRequest>>;
export type SameBackendProfile = Assert<Equal<Auth.UpdateProfileRequest, UpdateProfileBody>>;
export type ParsedPagination = Assert<Equal<PaginationQuery, { limit?: number; offset?: number }>>;
export const pagination: PaginationQuery = paginationQuerySchema.parse({ limit: "10" });
// @ts-expect-error The parsed output is numeric, even when query input was a string.
export const unparsed: PaginationQuery = { limit: "10" };
export const address: User.AddAddressRequest = {
  type: "shipping",
  addressLine1: "Main St",
  city: "Colombo",
  country: "LK",
};
export const giftCard: User.AddPaymentMethodRequest = { type: "gift_card" };
// @ts-expect-error Wire enum values follow the backend's lowercase vocabulary.
export const wrongCase: User.AddressType = "SHIPPING";
export const pageSchema = paginatedResponseShape(z.object({ id: z.string() }));
export type TypedPageItem = Assert<
  Equal<z.infer<typeof pageSchema>["items"][number], { id: string }>
>;
export type PublicAuthContracts = [
  Auth.RegisterRequest,
  Auth.LoginRequest,
  Auth.RefreshTokenRequest,
  Auth.LogoutRequest,
  Auth.ChangePasswordRequest,
  Auth.ForgotPasswordRequest,
  Auth.ResetPasswordRequest,
  Auth.VerifyEmailRequest,
  Auth.VerifyPhoneRequest,
  Auth.Enable2FARequest,
  Auth.Disable2FARequest,
  Auth.RegenerateBackupCodesRequest,
  Auth.Verify2FALoginRequest,
  Auth.ResendVerificationRequest,
  Auth.ChangeEmailRequest,
  Auth.DeleteAccountRequest,
  Auth.SignUpFormValues,
  Auth.SignInFormValues,
];
export type PublicUserContracts = [
  User.UpdateProfileRequest,
  User.AddAddressRequest,
  User.UpdateAddressRequest,
  User.AddPaymentMethodRequest,
  User.UpdatePaymentMethodRequest,
  User.AddressType,
  User.PaymentMethodType,
];

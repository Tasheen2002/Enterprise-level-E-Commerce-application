import { z } from "zod";
import * as auth from "../src/auth";
import * as user from "../src/user";
import * as backend from "../../../modules/user-management/infra/http/validation/auth.schema";
import { updateProfileSchema } from "../../../modules/user-management/infra/http/validation/profile.schema";
import {
  addAddressSchema,
  updateAddressSchema,
} from "../../../modules/user-management/infra/http/validation/address.schema";
import {
  addPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "../../../modules/user-management/infra/http/validation/payment-method.schema";

export const schemaCases: Array<{
  name: string;
  shared: z.ZodObject;
  backend: z.ZodObject;
  valid: Record<string, unknown>;
  invalid: Record<string, unknown>;
}> = [
  {
    name: "register",
    shared: auth.registerRequestSchema,
    backend: backend.registerSchema,
    valid: { email: "test@example.com", password: "password" },
    invalid: { email: "bad", password: "password" },
  },
  {
    name: "login",
    shared: auth.loginRequestSchema,
    backend: backend.loginSchema,
    valid: { email: "test@example.com", password: "x" },
    invalid: { email: "test@example.com", password: "" },
  },
  {
    name: "refresh",
    shared: auth.refreshTokenRequestSchema,
    backend: backend.refreshTokenSchema,
    valid: { refreshToken: "token" },
    invalid: { refreshToken: "" },
  },
  {
    name: "logout",
    shared: auth.logoutRequestSchema,
    backend: backend.logoutSchema,
    valid: {},
    invalid: { refreshToken: "" },
  },
  {
    name: "change-password",
    shared: auth.changePasswordRequestSchema,
    backend: backend.changePasswordSchema,
    valid: { currentPassword: "x", newPassword: "password" },
    invalid: { currentPassword: "x", newPassword: "short" },
  },
  {
    name: "forgot-password",
    shared: auth.forgotPasswordRequestSchema,
    backend: backend.forgotPasswordSchema,
    valid: { email: "test@example.com" },
    invalid: { email: "bad" },
  },
  {
    name: "reset-password",
    shared: auth.resetPasswordRequestSchema,
    backend: backend.resetPasswordSchema,
    valid: { token: "token", newPassword: "password" },
    invalid: { token: "", newPassword: "password" },
  },
  {
    name: "verify-email",
    shared: auth.verifyEmailRequestSchema,
    backend: backend.verifyEmailSchema,
    valid: { token: "token" },
    invalid: { token: "" },
  },
  {
    name: "verify-phone",
    shared: auth.verifyPhoneRequestSchema,
    backend: backend.verifyPhoneSchema,
    valid: { idToken: "token" },
    invalid: { idToken: "" },
  },
  {
    name: "enable-2fa",
    shared: auth.enable2FARequestSchema,
    backend: backend.enable2FASchema,
    valid: { code: "123456" },
    invalid: { code: "12345x" },
  },
  {
    name: "disable-2fa",
    shared: auth.disable2FARequestSchema,
    backend: backend.disable2FASchema,
    valid: { password: "x" },
    invalid: { password: "" },
  },
  {
    name: "regenerate-codes",
    shared: auth.regenerateBackupCodesRequestSchema,
    backend: backend.regenerateBackupCodesSchema,
    valid: { password: "x" },
    invalid: { password: "" },
  },
  {
    name: "verify-2fa-login",
    shared: auth.verify2FALoginRequestSchema,
    backend: backend.verify2FALoginSchema,
    valid: { pendingToken: "token", code: "ABCD-EFGH" },
    invalid: { pendingToken: "token", code: "12345" },
  },
  {
    name: "resend-verification",
    shared: auth.resendVerificationRequestSchema,
    backend: backend.resendVerificationSchema,
    valid: { email: "test@example.com" },
    invalid: { email: "bad" },
  },
  {
    name: "change-email",
    shared: auth.changeEmailRequestSchema,
    backend: backend.changeEmailSchema,
    valid: { newEmail: "test@example.com", password: "x" },
    invalid: { newEmail: "bad", password: "x" },
  },
  {
    name: "delete-account",
    shared: auth.deleteAccountRequestSchema,
    backend: backend.deleteAccountSchema,
    valid: { password: "x" },
    invalid: { password: "" },
  },
  {
    name: "profile",
    shared: user.updateProfileRequestSchema,
    backend: updateProfileSchema,
    valid: {},
    invalid: { locale: "en" },
  },
  {
    name: "add-address",
    shared: user.addAddressRequestSchema,
    backend: addAddressSchema,
    valid: { type: "shipping", addressLine1: "1 Main St", city: "Colombo", country: "LK" },
    invalid: { type: "OTHER" },
  },
  {
    name: "update-address",
    shared: user.updateAddressRequestSchema,
    backend: updateAddressSchema,
    valid: {},
    invalid: { city: "" },
  },
  {
    name: "add-payment",
    shared: user.addPaymentMethodRequestSchema,
    backend: addPaymentMethodSchema,
    valid: { type: "cod" },
    invalid: { type: "OTHER" },
  },
  {
    name: "update-payment",
    shared: user.updatePaymentMethodRequestSchema,
    backend: updatePaymentMethodSchema,
    valid: {},
    invalid: { expMonth: 0 },
  },
];

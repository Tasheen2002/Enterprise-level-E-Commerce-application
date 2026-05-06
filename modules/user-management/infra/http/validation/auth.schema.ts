import { z } from "zod";
import { USER_MANAGEMENT_CONSTANTS } from "../../../domain/constants/user-management.constants";

// ============================================================================
// Request body schemas
// ============================================================================

// Name max length is sourced from the domain constant so the route validator
// matches User.validateName(). Previously the schema accepted up to 100 chars,
// then the entity rejected at 50 — silent 422 from the domain layer.
export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(USER_MANAGEMENT_CONSTANTS.PASSWORD_MIN_LENGTH).max(USER_MANAGEMENT_CONSTANTS.PASSWORD_MAX_LENGTH),
  phone: z.string().optional(),
  firstName: z.string().max(USER_MANAGEMENT_CONSTANTS.USER_NAME_MAX_LENGTH).optional(),
  lastName: z.string().max(USER_MANAGEMENT_CONSTANTS.USER_NAME_MAX_LENGTH).optional(),
  // role is intentionally NOT accepted from clients — defaults to CUSTOMER server-side.
  // Admin/staff roles are assigned via separate admin endpoints.
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Logout body — refreshToken is OPTIONAL for backwards compatibility, but
// clients SHOULD send it. Without it, the refresh token remains valid until
// natural expiry, defeating the point of logout. Future: deprecate the
// no-refreshToken path and make it required.
export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z.email(),
});

export const changeEmailSchema = z.object({
  newEmail: z.email(),
  password: z.string().min(1).max(128),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
});

// ============================================================================
// Inferred body types
// ============================================================================

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
export type LogoutBody = z.infer<typeof logoutSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationBody = z.infer<typeof resendVerificationSchema>;
export type ChangeEmailBody = z.infer<typeof changeEmailSchema>;
export type DeleteAccountBody = z.infer<typeof deleteAccountSchema>;

// ============================================================================
// JSON Schema response objects (for Swagger / Fastify schema docs)
// ============================================================================

export const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string' },
    isGuest: { type: 'boolean' },
    emailVerified: { type: 'boolean' },
    phoneVerified: { type: 'boolean' },
  },
};

export const authResultResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    expiresIn: { type: 'number' },
    tokenType: { type: 'string' },
    user: userResponseSchema,
  },
};

export const userIdentityResponseSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string' },
  },
};

export const refreshTokenResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    expiresIn: { type: 'number' },
  },
};

// Standard "action confirmation" payload returned by lifecycle endpoints
// (forgot/reset password, verify email, etc.).
export const actionResponseSchema = {
  type: 'object',
  properties: {
    action: { type: 'string' },
  },
};

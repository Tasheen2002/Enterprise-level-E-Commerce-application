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

// Firebase ID tokens are JWTs (~1.5kB typically, but bursty) — cap at 4kB to
// reject obvious junk while leaving headroom for future provider claims.
export const googleLoginSchema = z.object({
  idToken: z.string().min(1).max(4096),
});

// Phone verification re-uses the same Firebase ID-token shape — the
// token is minted by `signInWithPhoneNumber` on the client and carries
// the verified phone in its `phone_number` claim. Same 4kB cap.
export const verifyPhoneSchema = z.object({
  idToken: z.string().min(1).max(4096),
});

// --- Two-factor authentication ---

// Enable: a 6-digit TOTP code from the user's authenticator app proves
// they can actually read codes from the secret we issued in /setup.
export const enable2FASchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

// Disable: password-gated so a stolen access token alone cannot
// downgrade the account's security profile.
export const disable2FASchema = z.object({
  password: z.string().min(1).max(128),
});

// Regenerate backup codes: same gate as disable.
export const regenerateBackupCodesSchema = z.object({
  password: z.string().min(1).max(128),
});

// Step 2 of login. `code` is either a 6-digit TOTP or a backup code
// (XXXX-XXXX, dashes optional). We accept a wider range here and let
// the service decide which path matched — the service's verify chain
// short-circuits on the first hit.
export const verify2FALoginSchema = z.object({
  pendingToken: z.string().min(1).max(4096),
  code: z.string().min(6).max(20),
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
export type GoogleLoginBody = z.infer<typeof googleLoginSchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
export type VerifyPhoneBody = z.infer<typeof verifyPhoneSchema>;
export type Enable2FABody = z.infer<typeof enable2FASchema>;
export type Disable2FABody = z.infer<typeof disable2FASchema>;
export type RegenerateBackupCodesBody = z.infer<typeof regenerateBackupCodesSchema>;
export type Verify2FALoginBody = z.infer<typeof verify2FALoginSchema>;
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
    updatedAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
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
    isGuest: { type: 'boolean' },
    emailVerified: { type: 'boolean' },
    phoneVerified: { type: 'boolean' },
    twoFactorEnabled: { type: 'boolean' },
    updatedAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
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

// Phone verification echoes back the verified number so the client
// doesn't need a separate `/users/me` round-trip to render the new
// state. The number comes straight from the Firebase token claim.
export const verifyPhoneResponseSchema = {
  type: 'object',
  properties: {
    action: { type: 'string' },
    phoneNumber: { type: 'string' },
  },
};

// /auth/2fa/setup — secret + pre-rendered QR-code data URL.
export const setup2FAResponseSchema = {
  type: 'object',
  properties: {
    secret: { type: 'string' },
    qrCodeDataUrl: { type: 'string' },
  },
};

// /auth/2fa/enable + /backup-codes/regenerate — single-use codes shown
// once. Plaintext is intentional: this is the only response that ever
// carries them.
export const backupCodesResponseSchema = {
  type: 'object',
  properties: {
    backupCodes: { type: 'array', items: { type: 'string' } },
  },
};

// Login response is now a discriminated union. The Fastify schema is
// intentionally permissive (oneOf) — clients narrow on the `kind`
// field. Keeping the schema loose here also lets us avoid splitting
// /auth/login into two endpoints.
export const loginResponseSchema = {
  oneOf: [
    {
      type: 'object',
      properties: {
        kind: { const: 'success' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: userResponseSchema,
        expiresIn: { type: 'number' },
        tokenType: { type: 'string' },
      },
    },
    {
      type: 'object',
      properties: {
        kind: { const: 'two_factor_required' },
        pendingToken: { type: 'string' },
      },
    },
  ],
};

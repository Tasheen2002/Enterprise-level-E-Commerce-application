import { z } from "zod";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const NAME_MAX = 50;

// ─── Wire schemas (exact match with backend) ────────────────────────────────

export const registerRequestSchema = z.object({
  email: z.string().email("Please provide a valid correspondence email"),
  password: z
    .string()
    .min(
      PASSWORD_MIN,
      `Security Key must be at least ${PASSWORD_MIN} characters`,
    )
    .max(PASSWORD_MAX),
  phone: z.string().optional(),
  firstName: z.string().max(NAME_MAX).optional(),
  lastName: z.string().max(NAME_MAX).optional(),
});

export const loginRequestSchema = z.object({
  email: z.string().email("Please provide a valid correspondence email"),
  password: z.string().min(1, "Security Key is required").max(PASSWORD_MAX),
  rememberMe: z.boolean().optional(),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(PASSWORD_MAX),
  newPassword: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
});

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationRequestSchema = z.object({
  email: z.string().email(),
});

export const updateProfileRequestSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  title: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(), // We'll validate date string format in the UI
  residentOf: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2,3})?$/).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  // Public ImageKit URL (or null to clear). Capped at 2 KB to defend
  // against accidental payload bloat — real ImageKit URLs are well under
  // 500 chars.
  avatarUrl: z.string().url().max(2048).nullable().optional(),
  prefs: z.record(z.string(), z.unknown()).optional(),
  stylePreferences: z.record(z.string(), z.unknown()).optional(),
  preferredSizes: z.record(z.string(), z.string().optional()).optional(),
});

export const changeEmailRequestSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
});

export const deleteAccountRequestSchema = z.object({
  password: z.string().min(1),
});

// ─── Form-level schemas (extend wire schemas with UI-only fields) ───────────
// Sign-up form adds confirmPassword + agreeToTerms which are UI-only — they
// never hit the wire. The submit handler picks the wire fields off this
// shape before calling the API.

export const signUpFormSchema = registerRequestSchema
  .extend({
    firstName: z.string().min(1, "Given Name is required").max(NAME_MAX),
    lastName: z.string().min(1, "Surname is required").max(NAME_MAX),
    confirmPassword: z.string().min(1, "Please verify your security key"),
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: "Your agreement is required to commission an account",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Security Keys do not match",
  });

export const signInFormSchema = loginRequestSchema;

// ─── Inferred types ─────────────────────────────────────────────────────────

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type ResendVerificationRequest = z.infer<
  typeof resendVerificationRequestSchema
>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type ChangeEmailRequest = z.infer<typeof changeEmailRequestSchema>;
export type DeleteAccountRequest = z.infer<typeof deleteAccountRequestSchema>;

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
export type SignInFormValues = z.infer<typeof signInFormSchema>;

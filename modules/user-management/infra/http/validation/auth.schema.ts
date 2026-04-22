import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z.email(),
});

export const changeEmailSchema = z.object({
  newEmail: z.email(),
  password: z.string().min(1),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationBody = z.infer<typeof resendVerificationSchema>;
export type ChangeEmailBody = z.infer<typeof changeEmailSchema>;
export type DeleteAccountBody = z.infer<typeof deleteAccountSchema>;

// JSON Schema response objects (for Swagger docs)
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
    user: userResponseSchema,
  },
};

export const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    statusCode: { type: 'number' },
    message: { type: 'string' },
  },
};

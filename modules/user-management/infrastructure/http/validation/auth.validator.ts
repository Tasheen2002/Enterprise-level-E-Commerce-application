import { z } from "zod";
import { USER_MANAGEMENT_CONSTANTS } from "../../../domain/constants/user-management.constants";

const { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } = USER_MANAGEMENT_CONSTANTS;

export const registerSchema = z.object({
  email: z.string().check(z.email({ error: "Invalid email format" })),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().check(z.email({ error: "Invalid email format" })),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `New password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `New password cannot exceed ${PASSWORD_MAX_LENGTH} characters`),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const initiatePasswordResetSchema = z.object({
  email: z.string().check(z.email({ error: "Invalid email format" })),
});

export const resetPasswordSchema = z.object({
  email: z.string().check(z.email({ error: "Invalid email format" })),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`),
});

export const verify2faSchema = z.object({
  tempToken: z.string().min(1, "Temp token is required"),
  code: z.string().min(6, "2FA code must be 6 digits").max(6, "2FA code must be 6 digits"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type Verify2faInput = z.infer<typeof verify2faSchema>;

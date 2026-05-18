import { request, ApiCallError } from "@/lib/api-client";
export { ApiCallError };
import { setAuthToken, setRefreshToken, syncAuthCookies } from "@/lib/auth";
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ChangePasswordRequest,
  ChangeEmailRequest,
  DeleteAccountRequest,
} from "@tasheen/validation/auth";
import type { AuthResult, LoginResponse, UserIdentity, RefreshTokenResult, UserProfile, Address, AddressRequest, PaymentMethod, PaymentMethodRequest, AvatarUploadToken, BackupCodesResult, Setup2FAResult } from "./types";

// ─── Endpoints ──────────────────────────────────────────────────────────────

export async function register(input: RegisterRequest): Promise<AuthResult> {
  const result = await request<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await persistTokens(result);
  return result;
}

export async function login(input: LoginRequest): Promise<LoginResponse> {
  const result = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (result.kind === "success") {
    await persistTokens(result);
  }
  return result;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const result = await request<AuthResult>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  await persistTokens(result);
  return result;
}

export async function logout(refreshToken?: string): Promise<void> {
  await request<{ action: string }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

async function persistTokens(result: AuthResult): Promise<void> {
  setAuthToken(result.accessToken);
  if (result.refreshToken) {
    setRefreshToken(result.refreshToken);
  }
  await syncAuthCookies(result.accessToken, result.refreshToken);
}

export async function forgotPassword(input: ForgotPasswordRequest): Promise<void> {
  await request<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resetPassword(input: ResetPasswordRequest): Promise<void> {
  await request<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCurrentUser(): Promise<UserIdentity> {
  return request<UserIdentity>("/auth/me", {
    method: "GET",
  });
}

export async function refreshToken(input: RefreshTokenRequest): Promise<RefreshTokenResult> {
  const result = await request<RefreshTokenResult>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAuthToken(result.accessToken);
  if (result.refreshToken) {
    setRefreshToken(result.refreshToken);
  }
  await syncAuthCookies(result.accessToken, result.refreshToken);
  return result;
}

export async function verifyEmail(input: VerifyEmailRequest): Promise<void> {
  await request<void>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Two-factor authentication ---

export async function setup2FA(): Promise<Setup2FAResult> {
  return request<Setup2FAResult>("/auth/2fa/setup", { method: "POST" });
}

export async function enable2FA(code: string): Promise<BackupCodesResult> {
  return request<BackupCodesResult>("/auth/2fa/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function disable2FA(password: string): Promise<void> {
  await request<void>("/auth/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function regenerateBackupCodes(
  password: string,
): Promise<BackupCodesResult> {
  return request<BackupCodesResult>("/auth/2fa/backup-codes/regenerate", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

/**
 * Step 2 of the email/password + 2FA login. Exchanges the pending
 * token + a TOTP/backup code for a real session. Persists tokens on
 * success.
 */
export async function verify2FALogin(
  pendingToken: string,
  code: string,
): Promise<AuthResult> {
  const result = await request<AuthResult & { kind?: string }>(
    "/auth/2fa/verify",
    {
      method: "POST",
      body: JSON.stringify({ pendingToken, code }),
    },
  );
  await persistTokens(result);
  return result;
}

export async function verifyPhone(idToken: string): Promise<{ phoneNumber: string }> {
  return request<{ phoneNumber: string }>("/auth/verify-phone", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function resendVerification(input: ResendVerificationRequest): Promise<void> {
  await request<void>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function changePassword(input: ChangePasswordRequest): Promise<void> {
  await request<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function changeEmail(input: ChangeEmailRequest): Promise<void> {
  await request<void>("/auth/change-email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteAccount(input: DeleteAccountRequest): Promise<void> {
  await request<void>("/auth/delete-account", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getUserProfile(): Promise<UserProfile> {
  return request<UserProfile>("/users/me/profile", {
    method: "GET",
  });
}

export async function updateUserProfile(input: Partial<UserProfile>): Promise<UserProfile> {
  return request<UserProfile>("/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// --- Addresses ---

export async function getAddresses(): Promise<{ items: Address[]; total: number }> {
  return request<{ items: Address[]; total: number }>("/users/me/addresses", {
    method: "GET",
  });
}

export async function addAddress(input: AddressRequest): Promise<Address> {
  return request<Address>("/users/me/addresses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAddress(id: string, input: Partial<AddressRequest>): Promise<Address> {
  return request<Address>(`/users/me/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteAddress(id: string): Promise<void> {
  await request<void>(`/users/me/addresses/${id}`, {
    method: "DELETE",
  });
}

export async function setDefaultAddress(id: string): Promise<void> {
  await request<void>(`/users/me/addresses/${id}/default`, {
    method: "PATCH",
  });
}

// --- Payment Methods ---

export async function getPaymentMethods(): Promise<{ items: PaymentMethod[]; total: number }> {
  return request<{ items: PaymentMethod[]; total: number }>("/users/me/payment-methods", {
    method: "GET",
  });
}

export async function addPaymentMethod(input: PaymentMethodRequest): Promise<PaymentMethod> {
  return request<PaymentMethod>("/users/me/payment-methods", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePaymentMethod(id: string, input: Partial<PaymentMethodRequest>): Promise<PaymentMethod> {
  return request<PaymentMethod>(`/users/me/payment-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await request<void>(`/users/me/payment-methods/${id}`, {
    method: "DELETE",
  });
}

export async function setDefaultPaymentMethod(id: string): Promise<void> {
  await request<void>(`/users/me/payment-methods/${id}/default`, {
    method: "PATCH",
  });
}

// --- Stripe SetupIntent flow (PCI-compliant card collection) ---

export interface SetupIntentResult {
  clientSecret: string;
  customerId: string;
}

export async function createPaymentMethodSetupIntent(): Promise<SetupIntentResult> {
  return request<SetupIntentResult>("/users/me/payment-methods/setup-intent", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function attachPaymentMethod(input: {
  stripePaymentMethodId: string;
  isDefault?: boolean;
  billingAddressId?: string;
}): Promise<PaymentMethod> {
  return request<PaymentMethod>("/users/me/payment-methods/attach", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Avatar upload (ImageKit signed direct upload) ---

/**
 * Ask the backend for a short-lived ImageKit upload token. The browser
 * uses these params to upload the file directly to ImageKit — bytes do
 * not pass through our API.
 */
export async function getAvatarUploadToken(): Promise<AvatarUploadToken> {
  return request<AvatarUploadToken>(
    "/users/me/profile/avatar/upload-token",
    { method: "GET" },
  );
}

/**
 * Result of a successful ImageKit upload. We only consume `url` (saved to
 * `profile.avatarUrl`) and `fileId` (kept for future deletion support);
 * other fields are documented for completeness.
 */
export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  filePath: string;
  thumbnailUrl?: string;
}

/**
 * POST a file to ImageKit's upload API using a token issued by our
 * backend. ImageKit verifies the HMAC signature server-side, so a
 * leaked token can only be used inside its 5-minute window for the
 * folder it was scoped to.
 *
 * Note: this is a cross-origin POST to upload.imagekit.io. We do NOT
 * send the user's session cookie or Bearer header — the signature in
 * the form fields is the auth.
 */
export async function uploadToImageKit(
  file: File,
  auth: AvatarUploadToken,
): Promise<ImageKitUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("fileName", `avatar-${Date.now()}-${file.name}`);
  form.append("publicKey", auth.publicKey);
  form.append("token", auth.token);
  form.append("expire", String(auth.expire));
  form.append("signature", auth.signature);
  form.append("folder", auth.folder);
  form.append("useUniqueFileName", "true");

  const response = await fetch(auth.uploadEndpoint, {
    method: "POST",
    body: form,
    // No `credentials` — this MUST be a clean cross-origin upload.
  });

  if (!response.ok) {
    let message = "ImageKit upload failed";
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // ignore non-JSON error
    }
    throw new Error(message);
  }

  return (await response.json()) as ImageKitUploadResult;
}

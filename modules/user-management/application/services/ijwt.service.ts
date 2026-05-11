export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh" | "2fa_pending";
  updatedAt?: string;
  createdAt?: string;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Payload for the short-lived "I passed the password step but still
 * owe a TOTP code" token. Carries `rememberMe` so the second step
 * issues a refresh token of the right lifetime.
 */
export interface PendingTwoFactorPayload {
  userId: string;
  email: string;
  rememberMe: boolean;
  type: "2fa_pending";
}

export interface IJwtService {
  signAccess(payload: Omit<TokenPayload, "type">): string;
  signRefresh(payload: Omit<TokenPayload, "type">, rememberMe?: boolean): string;
  verifyAccess(token: string): TokenPayload;
  verifyRefresh(token: string): TokenPayload;
  getAccessExpiresInSeconds(): number;

  /** Sign the 2FA-pending token. Lifetime is short (~5 min). */
  signTwoFactorPending(
    payload: Omit<PendingTwoFactorPayload, "type">,
  ): string;
  /** Verify + decode. Throws on invalid/expired/wrong-type. */
  verifyTwoFactorPending(token: string): PendingTwoFactorPayload;
}

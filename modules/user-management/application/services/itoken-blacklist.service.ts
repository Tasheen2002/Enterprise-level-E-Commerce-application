/**
 * Abstraction for token lifecycle management.
 * Application-layer port — implemented by infra-layer TokenBlacklistService.
 */
export interface ITokenBlacklistService {
  blacklistToken(token: string, ttlMs?: number): void;
  isTokenBlacklisted(token: string): boolean;
  storeVerificationToken(token: string, userId: string, email: string): void;
  getVerificationToken(token: string): { userId: string; email: string } | null;
  storePasswordResetToken(token: string, userId: string, email: string): void;
  getPasswordResetToken(
    token: string,
  ): { userId: string; email: string } | null;
  /** Counts a failure; the identifier locks after `maxAttempts` failures inside the lockout window. */
  recordFailedAttempt(identifier: string, maxAttempts?: number): void;
  isAccountLocked(identifier: string): boolean;
  clearFailedAttempts(identifier: string): void;
  /** Records a one-time code as spent so it cannot be replayed within `ttlMs`. */
  markOneTimeCodeUsed(key: string, ttlMs: number): void;
  isOneTimeCodeUsed(key: string): boolean;
}

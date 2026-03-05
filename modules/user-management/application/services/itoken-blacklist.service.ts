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
  recordFailedAttempt(identifier: string): void;
  isAccountLocked(identifier: string): boolean;
  clearFailedAttempts(identifier: string): void;
}

/**
 * In-memory token blacklist for JWT revocation.
 * In production, replace with Redis or database-backed store.
 */

interface TokenEntry {
  expiresAt: number;
}

interface VerificationTokenEntry {
  userId: string;
  email: string;
  expiresAt: number;
}

interface PasswordResetTokenEntry {
  userId: string;
  email: string;
  expiresAt: number;
}

interface FailedAttemptEntry {
  count: number;
  lockedUntil?: number;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TOKEN_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour

const blacklistedTokens = new Map<string, TokenEntry>();
const verificationTokens = new Map<string, VerificationTokenEntry>();
const passwordResetTokens = new Map<string, PasswordResetTokenEntry>();
const failedAttempts = new Map<string, FailedAttemptEntry>();

// Periodically clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of blacklistedTokens) {
    if (entry.expiresAt < now) blacklistedTokens.delete(token);
  }
  for (const [token, entry] of verificationTokens) {
    if (entry.expiresAt < now) verificationTokens.delete(token);
  }
  for (const [token, entry] of passwordResetTokens) {
    if (entry.expiresAt < now) passwordResetTokens.delete(token);
  }
}, 60 * 1000).unref();

export const TokenBlacklistService = {
  blacklistToken(token: string, ttlMs = 7 * 24 * 60 * 60 * 1000): void {
    blacklistedTokens.set(token, { expiresAt: Date.now() + ttlMs });
  },

  isTokenBlacklisted(token: string): boolean {
    const entry = blacklistedTokens.get(token);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      blacklistedTokens.delete(token);
      return false;
    }
    return true;
  },

  storeVerificationToken(token: string, userId: string, email: string): void {
    verificationTokens.set(token, {
      userId,
      email,
      expiresAt: Date.now() + VERIFICATION_TOKEN_TTL_MS,
    });
  },

  getVerificationToken(token: string): { userId: string; email: string } | null {
    const entry = verificationTokens.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      verificationTokens.delete(token);
      return null;
    }
    verificationTokens.delete(token); // one-time use
    return { userId: entry.userId, email: entry.email };
  },

  storePasswordResetToken(token: string, userId: string, email: string): void {
    passwordResetTokens.set(token, {
      userId,
      email,
      expiresAt: Date.now() + PASSWORD_RESET_TOKEN_TTL_MS,
    });
  },

  getPasswordResetToken(token: string): { userId: string; email: string } | null {
    const entry = passwordResetTokens.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      passwordResetTokens.delete(token);
      return null;
    }
    passwordResetTokens.delete(token); // one-time use
    return { userId: entry.userId, email: entry.email };
  },

  recordFailedAttempt(identifier: string): void {
    const entry = failedAttempts.get(identifier) ?? { count: 0 };
    entry.count += 1;
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
      entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
    failedAttempts.set(identifier, entry);
  },

  isAccountLocked(identifier: string): boolean {
    const entry = failedAttempts.get(identifier);
    if (!entry?.lockedUntil) return false;
    if (entry.lockedUntil < Date.now()) {
      failedAttempts.delete(identifier);
      return false;
    }
    return true;
  },

  clearFailedAttempts(identifier: string): void {
    failedAttempts.delete(identifier);
  },
};

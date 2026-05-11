import { UserId } from '../value-objects/user-id.vo';

/**
 * One row per single-use backup code. The plaintext is shown to the
 * user exactly once at generation time; only the hash lives here.
 *
 * `usedAt` is mutated rather than the row deleted so we can still tell
 * the difference between "never had one" and "already burned through
 * them all" in audits/incident response.
 */
export interface TwoFactorBackupCodeRecord {
  id: string;
  userId: string;
  codeHash: string;
  usedAt: Date | null;
  createdAt: Date;
}

export interface ITwoFactorBackupCodeRepository {
  /**
   * Replace the user's entire set of backup codes atomically. Used on
   * 2FA enable and on regenerate — there is no concept of "add one";
   * codes are issued as a batch.
   */
  replaceForUser(userId: UserId, codeHashes: string[]): Promise<void>;

  /** All unused codes for the user (used to attempt verify on login). */
  findUnusedByUser(userId: UserId): Promise<TwoFactorBackupCodeRecord[]>;

  /** Mark a single code as consumed. */
  markUsed(codeId: string): Promise<void>;

  /** Disable-2FA cleanup. */
  deleteAllForUser(userId: UserId): Promise<void>;
}

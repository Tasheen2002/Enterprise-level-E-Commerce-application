/**
 * Backup codes are single-use, human-typeable strings shown to the
 * user once at issue time and then discarded server-side (only their
 * hashes are stored). They let the user log in if their authenticator
 * app is unavailable — without them, "lost my phone" means "lost my
 * account."
 */
export interface ITwoFactorBackupCodeService {
  /**
   * Generate `count` plaintext codes plus their hashes, in a single
   * call so the application layer doesn't have to coordinate two
   * services. Plaintext goes to the user (one-time); hashes go to the
   * repository.
   */
  generate(count: number): { plainCodes: string[]; codeHashes: string[] };

  /**
   * Constant-time-ish check of a user-supplied plaintext against a
   * stored hash. Returns true on match.
   */
  verify(plainCode: string, codeHash: string): boolean;
}

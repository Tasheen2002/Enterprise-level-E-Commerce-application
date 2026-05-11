import crypto from "crypto";
import { ITwoFactorBackupCodeService } from "../../application/services/itwo-factor-backup-code.service";

/**
 * Generates 10-character backup codes formatted as `XXXX-XXXX` for
 * easier reading/typing, hashes them with sha256 (no per-code salt —
 * see note below) for storage.
 *
 * Why no bcrypt/argon2: backup codes are 8 random alphanumeric chars
 * = ~41 bits of entropy each. Even at offline-attack scale that's
 * already more work than rainbow-tabling; bcrypt's purpose is
 * protecting low-entropy human passwords. sha256 is intentionally
 * fast here so verification (which iterates over up to 10 unused
 * hashes per login) stays sub-millisecond.
 */
export class TwoFactorBackupCodeService implements ITwoFactorBackupCodeService {
  private static readonly ALPHABET =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — easy to mistype

  generate(count: number): { plainCodes: string[]; codeHashes: string[] } {
    const plainCodes: string[] = [];
    const codeHashes: string[] = [];
    for (let i = 0; i < count; i++) {
      const plain = TwoFactorBackupCodeService.randomCode();
      plainCodes.push(plain);
      codeHashes.push(TwoFactorBackupCodeService.hash(plain));
    }
    return { plainCodes, codeHashes };
  }

  verify(plainCode: string, codeHash: string): boolean {
    const normalised = TwoFactorBackupCodeService.normalise(plainCode);
    if (normalised.length === 0) return false;
    const candidateHash = TwoFactorBackupCodeService.hash(normalised);

    // `timingSafeEqual` requires equal-length buffers. sha256 hex is
    // always 64 chars so the lengths match — but assert anyway in
    // case future changes shift the digest.
    const a = Buffer.from(candidateHash, "utf8");
    const b = Buffer.from(codeHash, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  private static randomCode(): string {
    const half = (length: number): string => {
      const bytes = crypto.randomBytes(length);
      let out = "";
      for (let i = 0; i < length; i++) {
        // Modulo bias is acceptable here: alphabet length is 32, and
        // 256 % 32 === 0 — so the distribution is exactly uniform.
        out += this.ALPHABET[bytes[i]! % this.ALPHABET.length];
      }
      return out;
    };
    return `${half(4)}-${half(4)}`;
  }

  /** Hash + canonical-form input so case and dashes don't matter. */
  private static hash(plain: string): string {
    return crypto
      .createHash("sha256")
      .update(this.normalise(plain))
      .digest("hex");
  }

  /**
   * Strip whitespace and dashes, uppercase. The user might type the
   * code with mixed case or without the dash; we want any of those
   * to compare equal to the issued form.
   */
  private static normalise(plain: string): string {
    return plain.replace(/[\s-]/g, "").toUpperCase();
  }
}

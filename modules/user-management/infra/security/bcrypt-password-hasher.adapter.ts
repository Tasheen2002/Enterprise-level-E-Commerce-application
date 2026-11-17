import * as bcrypt from "bcryptjs";
import { IPasswordHasherService } from "../../application/services/password-hasher.service";
import { DomainValidationError } from "../../domain/errors/user-management.errors";

// Bcrypt-backed adapter for the `IPasswordHasherService` port. Lives in
// `infra/security/` so the third-party `bcryptjs` dependency does not leak
// into the application layer. The application service depends on the
// interface in `application/services/password-hasher.service.ts`; the
// container wires this adapter at boot.
// bcrypt only uses the first 72 bytes of its input; longer passwords would be
// silently truncated, so new passwords are capped at that byte length. Login
// still verifies existing hashes unchanged (legacy-compatible).
export const BCRYPT_MAX_PASSWORD_BYTES = 72;
const MIN_PASSWORD_LENGTH = 8;

export class BcryptPasswordHasherAdapter implements IPasswordHasherService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 12) {
    this.saltRounds = saltRounds;
  }

  async hash(password: string | null): Promise<string | null> {
    if (password === null || password === undefined) {
      return null;
    }

    if (password.length === 0) {
      throw new DomainValidationError("Password cannot be empty");
    }

    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string | null): Promise<boolean> {
    if (!hash) return false;
    if (!password) return false;

    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("Password must be at least 8 characters long");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Password must contain at least one lowercase letter");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Password must contain at least one uppercase letter");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Password must contain at least one number");
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Password must contain at least one special character");
    }

    if (password.length >= 12) {
      score += 1;
    }

    const tooLong = Buffer.byteLength(password, "utf8") > BCRYPT_MAX_PASSWORD_BYTES;
    if (tooLong) {
      feedback.push(`Password must be at most ${BCRYPT_MAX_PASSWORD_BYTES} bytes long`);
    }

    return {
      // Length limits are hard requirements; the character-class score only
      // applies once they are met.
      isValid: password.length >= MIN_PASSWORD_LENGTH && !tooLong && score >= 4,
      score,
      feedback,
    };
  }
}

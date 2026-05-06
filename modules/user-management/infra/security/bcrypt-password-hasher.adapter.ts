import * as bcrypt from "bcryptjs";
import { IPasswordHasherService } from "../../application/services/password-hasher.service";
import { DomainValidationError } from "../../domain/errors/user-management.errors";

// Bcrypt-backed adapter for the `IPasswordHasherService` port. Lives in
// `infra/security/` so the third-party `bcryptjs` dependency does not leak
// into the application layer. The application service depends on the
// interface in `application/services/password-hasher.service.ts`; the
// container wires this adapter at boot.
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

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Password must contain at least one special character");
    }

    if (password.length >= 12) {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }
}

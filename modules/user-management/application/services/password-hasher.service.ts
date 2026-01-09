import * as bcrypt from "bcryptjs";

export interface IPasswordHasherService {
  hash(password: string | null): Promise<string | null>;
  verify(password: string, hash: string | null): Promise<boolean>;
  needsRehash(hash: string | null): boolean;
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  };
  generateTemporaryPassword(length?: number): string;
  isGuestUser(hash: string | null): boolean;
  canUserLogin(hash: string | null): boolean;
}

export class PasswordHasherService implements IPasswordHasherService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 12) {
    this.saltRounds = saltRounds;
  }

  async hash(password: string | null): Promise<string | null> {
    // Handle guest users and social login users
    if (password === null || password === undefined) {
      return null;
    }

    // Regular users must have non-empty passwords
    if (password.length === 0) {
      throw new Error("Password cannot be empty");
    }

    return await bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string | null): Promise<boolean> {
    // Guest users and social login users cannot login with password
    if (hash === null || hash === undefined || hash === "") {
      return false;
    }

    // Password is required for verification
    if (!password || password.length === 0) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  needsRehash(hash: string | null): boolean {
    // Guest users and social login users don't have password hashes to rehash
    if (hash === null || hash === undefined || hash === "") {
      return false;
    }

    try {
      const rounds = bcrypt.getRounds(hash);
      return rounds < this.saltRounds;
    } catch (error) {
      // Invalid hash format, should be rehashed if user has a password
      return true;
    }
  }

  generateTemporaryPassword(length: number = 12): string {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
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

    const isValid = score >= 4;

    return {
      isValid,
      score,
      feedback,
    };
  }

  isGuestUser(hash: string | null): boolean {
    return hash === null || hash === undefined || hash === "";
  }

  canUserLogin(hash: string | null): boolean {
    return hash !== null && hash !== undefined && hash !== "";
  }

  // Additional utility methods for PostgreSQL schema alignment

  /**
   * Checks if a user can set a password (converts from guest to regular user)
   */
  canSetPassword(currentHash: string | null): boolean {
    // Guest users and social-only users can set passwords
    return this.isGuestUser(currentHash);
  }

  /**
   * Validates if a user requires a password for the given authentication method
   */
  requiresPassword(isGuest: boolean, hasSocialLogins: boolean): boolean {
    // Regular users without social logins must have passwords
    return !isGuest && !hasSocialLogins;
  }

  /**
   * Generates a secure password reset token (different from temporary password)
   */
  generateResetToken(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join("");

    return `${timestamp}_${randomBytes}`;
  }

  /**
   * Validates password against common security patterns
   */
  validatePasswordSecurity(password: string): {
    hasCommonPatterns: boolean;
    isCommonPassword: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let hasCommonPatterns = false;
    let isCommonPassword = false;

    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc/i,
      /(.)\1{2,}/, // Repeated characters
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        hasCommonPatterns = true;
        warnings.push("Password contains common patterns");
        break;
      }
    }

    // Check for very common passwords
    const commonPasswords = [
      "password",
      "123456",
      "password123",
      "admin",
      "qwerty",
      "letmein",
      "welcome",
      "monkey",
      "1234567890",
    ];

    if (
      commonPasswords.some((common) =>
        password.toLowerCase().includes(common.toLowerCase())
      )
    ) {
      isCommonPassword = true;
      warnings.push("Password contains common dictionary words");
    }

    return {
      hasCommonPatterns,
      isCommonPassword,
      warnings,
    };
  }
}

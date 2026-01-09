export class Password {
  private readonly value: string;

  constructor(password: string) {
    if (!password) {
      throw new Error("Password is required");
    }

    if (!this.isValidPassword(password)) {
      throw new Error(this.getPasswordRequirements());
    }

    this.value = password;
  }

  private isValidPassword(password: string): boolean {
    // Minimum requirements
    const minLength = 8;
    const maxLength = 128;

    // Check length
    if (password.length < minLength || password.length > maxLength) {
      return false;
    }

    // Must contain at least one of each:
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  private getPasswordRequirements(): string {
    return "Password must be 8-128 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character";
  }

  getValue(): string {
    return this.value;
  }

  getStrength(): "weak" | "medium" | "strong" {
    const score = this.calculateStrengthScore();

    if (score >= 4) return "strong";
    if (score >= 3) return "medium";
    return "weak";
  }

  private calculateStrengthScore(): number {
    let score = 0;

    // Length bonus
    if (this.value.length >= 12) score += 1;
    if (this.value.length >= 16) score += 1;

    // Character variety
    if (/[A-Z]/.test(this.value)) score += 1;
    if (/[a-z]/.test(this.value)) score += 1;
    if (/\d/.test(this.value)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(this.value)) score += 1;

    // No common patterns
    if (!this.hasCommonPatterns()) score += 1;

    return score;
  }

  private hasCommonPatterns(): boolean {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /(.)\1{2,}/, // Repeated characters
    ];

    return commonPatterns.some((pattern) => pattern.test(this.value));
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }

  // Security methods
  isCompromised(): boolean {
    // In real implementation, check against known breached passwords
    const commonPasswords = [
      "password123",
      "Password1!",
      "12345678",
      "qwerty123",
      "admin123",
    ];

    return commonPasswords.includes(this.value);
  }

  meetsPolicy(policy: PasswordPolicy): boolean {
    if (this.value.length < policy.minLength) return false;
    if (policy.maxLength && this.value.length > policy.maxLength) return false;

    if (policy.requireUppercase && !/[A-Z]/.test(this.value)) return false;
    if (policy.requireLowercase && !/[a-z]/.test(this.value)) return false;
    if (policy.requireNumbers && !/\d/.test(this.value)) return false;
    if (
      policy.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(this.value)
    )
      return false;

    return true;
  }

  static fromString(password: string): Password {
    return new Password(password);
  }

  // Don't expose the actual password in string conversion for security
  toString(): string {
    return "[Password]";
  }
}

// Supporting interface for password policies
export interface PasswordPolicy {
  minLength: number;
  maxLength?: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Default password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

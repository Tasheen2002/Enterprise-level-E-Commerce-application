import { DomainValidationError } from '../errors/user-management.errors';

export class Password {
  private constructor(private readonly value: string) {}

  static create(password: string): Password {
    if (!password) throw new DomainValidationError('Password is required');

    if (!Password.isValidPassword(password)) {
      throw new DomainValidationError(
        'Password must be 8-128 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }

    return new Password(password);
  }

  private static isValidPassword(password: string): boolean {
    if (password.length < 8 || password.length > 128) return false;
    return (
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  }

  getValue(): string { return this.value; }

  getStrength(): 'weak' | 'medium' | 'strong' {
    const score = this.calculateStrengthScore();
    if (score >= 4) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }

  private calculateStrengthScore(): number {
    let score = 0;
    if (this.value.length >= 12) score++;
    if (this.value.length >= 16) score++;
    if (/[A-Z]/.test(this.value)) score++;
    if (/[a-z]/.test(this.value)) score++;
    if (/\d/.test(this.value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(this.value)) score++;
    if (!this.hasCommonPatterns()) score++;
    return score;
  }

  private hasCommonPatterns(): boolean {
    return [/123456/, /password/i, /qwerty/i, /abc123/i, /(.)\1{2,}/].some((p) => p.test(this.value));
  }

  equals(other: Password): boolean { return this.value === other.value; }
  toString(): string { return '[Password]'; }

  isCompromised(): boolean {
    const commonPasswords = ['password123', 'Password1!', '12345678', 'qwerty123', 'admin123'];
    return commonPasswords.includes(this.value);
  }

  meetsPolicy(policy: PasswordPolicy): boolean {
    if (this.value.length < policy.minLength) return false;
    if (policy.maxLength && this.value.length > policy.maxLength) return false;
    if (policy.requireUppercase && !/[A-Z]/.test(this.value)) return false;
    if (policy.requireLowercase && !/[a-z]/.test(this.value)) return false;
    if (policy.requireNumbers && !/\d/.test(this.value)) return false;
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(this.value)) return false;
    return true;
  }
}

export interface PasswordPolicy {
  minLength: number;
  maxLength?: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

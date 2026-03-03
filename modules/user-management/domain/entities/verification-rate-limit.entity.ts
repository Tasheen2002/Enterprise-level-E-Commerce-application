import { VerificationType } from "./verification-token.entity";

export { VerificationType };

export class VerificationRateLimit {
  private constructor(
    private readonly rateLimitId: string,
    private readonly userId: string | null,
    private readonly email: string | null,
    private readonly phone: string | null,
    private readonly type: VerificationType,
    private attempts: number,
    private lastAttemptAt: Date,
    private readonly resetAt: Date
  ) {}

  static create(data: CreateVerificationRateLimitData): VerificationRateLimit {
    const rateLimitId = crypto.randomUUID();
    const now = new Date();

    return new VerificationRateLimit(
      rateLimitId,
      data.userId || null,
      data.email || null,
      data.phone || null,
      data.type,
      1,
      now,
      data.resetAt
    );
  }

  static fromDatabaseRow(row: VerificationRateLimitRow): VerificationRateLimit {
    return new VerificationRateLimit(
      row.rate_limit_id,
      row.user_id,
      row.email,
      row.phone,
      row.type,
      row.attempts,
      row.last_attempt_at,
      row.reset_at
    );
  }

  getRateLimitId(): string {
    return this.rateLimitId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getEmail(): string | null {
    return this.email;
  }

  getPhone(): string | null {
    return this.phone;
  }

  getType(): VerificationType {
    return this.type;
  }

  getAttempts(): number {
    return this.attempts;
  }

  getLastAttemptAt(): Date {
    return this.lastAttemptAt;
  }

  getResetAt(): Date {
    return this.resetAt;
  }

  isExpired(): boolean {
    return new Date() > this.resetAt;
  }

  incrementAttempts(): void {
    this.attempts++;
    this.lastAttemptAt = new Date();
  }

  toDatabaseRow(): VerificationRateLimitRow {
    return {
      rate_limit_id: this.rateLimitId,
      user_id: this.userId,
      email: this.email,
      phone: this.phone,
      type: this.type,
      attempts: this.attempts,
      last_attempt_at: this.lastAttemptAt,
      reset_at: this.resetAt,
    };
  }
}

export interface CreateVerificationRateLimitData {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  type: VerificationType;
  resetAt: Date;
}

export interface VerificationRateLimitRow {
  rate_limit_id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  type: VerificationType;
  attempts: number;
  last_attempt_at: Date;
  reset_at: Date;
}

import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { VerificationType } from '../enums/verification-type.enum';

export interface VerificationRateLimitProps {
  rateLimitId: string;
  userId: string | null;
  email: string | null;
  phone: string | null;
  type: VerificationType;
  attempts: number;
  lastAttemptAt: Date;
  resetAt: Date;
}

export class VerificationRateLimit extends AggregateRoot {
  private props: VerificationRateLimitProps;

  private constructor(props: VerificationRateLimitProps) {
    super();
    this.props = props;
  }

  static create(params: {
    userId?: string | null;
    email?: string | null;
    phone?: string | null;
    type: VerificationType;
    resetAt: Date;
  }): VerificationRateLimit {
    const now = new Date();

    return new VerificationRateLimit({
      rateLimitId: crypto.randomUUID(),
      userId: params.userId || null,
      email: params.email || null,
      phone: params.phone || null,
      type: params.type,
      attempts: 1,
      lastAttemptAt: now,
      resetAt: params.resetAt,
    });
  }

  static reconstitute(props: VerificationRateLimitProps): VerificationRateLimit {
    return new VerificationRateLimit(props);
  }

  get rateLimitId(): string {
    return this.props.rateLimitId;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get type(): VerificationType {
    return this.props.type;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get lastAttemptAt(): Date {
    return this.props.lastAttemptAt;
  }

  get resetAt(): Date {
    return this.props.resetAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.resetAt;
  }

  incrementAttempts(): void {
    this.props.attempts++;
    this.props.lastAttemptAt = new Date();
  }
}

import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { InvalidOperationError } from '../errors/user-management.errors';
import { VerificationType } from '../enums/verification-type.enum';

export interface VerificationTokenProps {
  tokenId: string;
  userId: string;
  token: string;
  type: VerificationType;
  email: string | null;
  phone: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class VerificationToken extends AggregateRoot {
  private props: VerificationTokenProps;

  private constructor(props: VerificationTokenProps) {
    super();
    this.props = props;
  }

  static create(params: {
    userId: string;
    token: string;
    type: VerificationType;
    email?: string | null;
    phone?: string | null;
    expiresAt: Date;
  }): VerificationToken {
    return new VerificationToken({
      tokenId: crypto.randomUUID(),
      userId: params.userId,
      token: params.token,
      type: params.type,
      email: params.email || null,
      phone: params.phone || null,
      expiresAt: params.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: VerificationTokenProps): VerificationToken {
    return new VerificationToken(props);
  }

  get tokenId(): string {
    return this.props.tokenId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get token(): string {
    return this.props.token;
  }

  get type(): VerificationType {
    return this.props.type;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get usedAt(): Date | null {
    return this.props.usedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  markAsUsed(): void {
    if (this.isUsed()) {
      throw new InvalidOperationError('Token has already been used');
    }

    if (this.isExpired()) {
      throw new InvalidOperationError('Cannot use expired token');
    }

    this.props.usedAt = new Date();
  }
}

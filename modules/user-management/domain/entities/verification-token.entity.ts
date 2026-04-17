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

export interface VerificationTokenDTO {
  tokenId: string;
  userId: string;
  token: string;
  type: VerificationType;
  email: string | null;
  phone: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export class VerificationToken {
  private constructor(private props: VerificationTokenProps) {}

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

  static fromPersistence(props: VerificationTokenProps): VerificationToken {
    return new VerificationToken(props);
  }

  get tokenId(): string { return this.props.tokenId; }
  get userId(): string { return this.props.userId; }
  get token(): string { return this.props.token; }
  get type(): VerificationType { return this.props.type; }
  get email(): string | null { return this.props.email; }
  get phone(): string | null { return this.props.phone; }
  get expiresAt(): Date { return this.props.expiresAt; }
  get usedAt(): Date | null { return this.props.usedAt; }
  get createdAt(): Date { return this.props.createdAt; }

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
    if (this.isUsed()) throw new InvalidOperationError('Token has already been used');
    if (this.isExpired()) throw new InvalidOperationError('Cannot use expired token');
    this.props.usedAt = new Date();
  }

  equals(other: VerificationToken): boolean {
    return this.props.tokenId === other.props.tokenId;
  }

  static toDTO(token: VerificationToken): VerificationTokenDTO {
    return {
      tokenId: token.tokenId,
      userId: token.userId,
      token: token.token,
      type: token.type,
      email: token.email,
      phone: token.phone,
      expiresAt: token.expiresAt.toISOString(),
      usedAt: token.usedAt?.toISOString() || null,
      createdAt: token.createdAt.toISOString(),
    };
  }
}

import { InvalidOperationError } from "../errors/user-management.errors";

export class VerificationToken {
  private constructor(
    private readonly tokenId: string,
    private readonly userId: string,
    private readonly token: string,
    private readonly type: VerificationType,
    private readonly email: string | null,
    private readonly phone: string | null,
    private readonly expiresAt: Date,
    private usedAt: Date | null,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateVerificationTokenData): VerificationToken {
    const tokenId = crypto.randomUUID();
    const now = new Date();

    return new VerificationToken(
      tokenId,
      data.userId,
      data.token,
      data.type,
      data.email || null,
      data.phone || null,
      data.expiresAt,
      null,
      now
    );
  }

  static reconstitute(data: VerificationTokenData): VerificationToken {
    return new VerificationToken(
      data.tokenId,
      data.userId,
      data.token,
      data.type,
      data.email,
      data.phone,
      data.expiresAt,
      data.usedAt,
      data.createdAt
    );
  }

  static fromDatabaseRow(row: VerificationTokenRow): VerificationToken {
    return new VerificationToken(
      row.token_id,
      row.user_id,
      row.token,
      row.type,
      row.email,
      row.phone,
      row.expires_at,
      row.used_at,
      row.created_at
    );
  }

  getTokenId(): string {
    return this.tokenId;
  }

  getUserId(): string {
    return this.userId;
  }

  getToken(): string {
    return this.token;
  }

  getType(): VerificationType {
    return this.type;
  }

  getEmail(): string | null {
    return this.email;
  }

  getPhone(): string | null {
    return this.phone;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getUsedAt(): Date | null {
    return this.usedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  markAsUsed(): void {
    if (this.isUsed()) {
      throw new InvalidOperationError("Token has already been used");
    }

    if (this.isExpired()) {
      throw new InvalidOperationError("Cannot use expired token");
    }

    this.usedAt = new Date();
  }

  toData(): VerificationTokenData {
    return {
      tokenId: this.tokenId,
      userId: this.userId,
      token: this.token,
      type: this.type,
      email: this.email,
      phone: this.phone,
      expiresAt: this.expiresAt,
      usedAt: this.usedAt,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): VerificationTokenRow {
    return {
      token_id: this.tokenId,
      user_id: this.userId,
      token: this.token,
      type: this.type,
      email: this.email,
      phone: this.phone,
      expires_at: this.expiresAt,
      used_at: this.usedAt,
      created_at: this.createdAt,
    };
  }
}

export enum VerificationType {
  EMAIL_VERIFICATION = "email_verification",
  PHONE_VERIFICATION = "phone_verification",
  PASSWORD_RESET = "password_reset",
}

export interface CreateVerificationTokenData {
  userId: string;
  token: string;
  type: VerificationType;
  email?: string | null;
  phone?: string | null;
  expiresAt: Date;
}

export interface VerificationTokenData {
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

export interface VerificationTokenRow {
  token_id: string;
  user_id: string;
  token: string;
  type: VerificationType;
  email: string | null;
  phone: string | null;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

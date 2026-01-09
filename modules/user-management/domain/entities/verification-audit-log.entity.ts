export class VerificationAuditLog {
  private constructor(
    private readonly logId: string,
    private readonly userId: string | null,
    private readonly email: string | null,
    private readonly phone: string | null,
    private readonly type: VerificationType,
    private readonly action: VerificationAction,
    private readonly ipAddress: string | null,
    private readonly userAgent: string | null,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateVerificationAuditLogData): VerificationAuditLog {
    const logId = crypto.randomUUID();
    const now = new Date();

    return new VerificationAuditLog(
      logId,
      data.userId || null,
      data.email || null,
      data.phone || null,
      data.type,
      data.action,
      data.ipAddress || null,
      data.userAgent || null,
      now
    );
  }

  static fromDatabaseRow(row: VerificationAuditLogRow): VerificationAuditLog {
    return new VerificationAuditLog(
      row.log_id,
      row.user_id,
      row.email,
      row.phone,
      row.type,
      row.action as VerificationAction,
      row.ip_address,
      row.user_agent,
      row.created_at
    );
  }

  getLogId(): string {
    return this.logId;
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

  getAction(): VerificationAction {
    return this.action;
  }

  getIpAddress(): string | null {
    return this.ipAddress;
  }

  getUserAgent(): string | null {
    return this.userAgent;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  toDatabaseRow(): VerificationAuditLogRow {
    return {
      log_id: this.logId,
      user_id: this.userId,
      email: this.email,
      phone: this.phone,
      type: this.type,
      action: this.action,
      ip_address: this.ipAddress,
      user_agent: this.userAgent,
      created_at: this.createdAt,
    };
  }
}

export enum VerificationType {
  EMAIL_VERIFICATION = "email_verification",
  PHONE_VERIFICATION = "phone_verification",
  PASSWORD_RESET = "password_reset",
}

export enum VerificationAction {
  SENT = "sent",
  VERIFIED = "verified",
  FAILED = "failed",
  EXPIRED = "expired",
}

export interface CreateVerificationAuditLogData {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  type: VerificationType;
  action: VerificationAction;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface VerificationAuditLogRow {
  log_id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  type: VerificationType;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

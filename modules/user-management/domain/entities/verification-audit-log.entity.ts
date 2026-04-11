import { VerificationType } from '../enums/verification-type.enum';
import { VerificationAction } from '../enums/verification-action.enum';

export interface VerificationAuditLogProps {
  logId: string;
  userId: string | null;
  email: string | null;
  phone: string | null;
  type: VerificationType;
  action: VerificationAction;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface VerificationAuditLogDTO {
  logId: string;
  userId: string | null;
  email: string | null;
  phone: string | null;
  type: VerificationType;
  action: VerificationAction;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export class VerificationAuditLog {
  private constructor(private props: VerificationAuditLogProps) {}

  static create(params: {
    userId?: string | null;
    email?: string | null;
    phone?: string | null;
    type: VerificationType;
    action: VerificationAction;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): VerificationAuditLog {
    return new VerificationAuditLog({
      logId: crypto.randomUUID(),
      userId: params.userId || null,
      email: params.email || null,
      phone: params.phone || null,
      type: params.type,
      action: params.action,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: VerificationAuditLogProps): VerificationAuditLog {
    return new VerificationAuditLog(props);
  }

  get logId(): string { return this.props.logId; }
  get userId(): string | null { return this.props.userId; }
  get email(): string | null { return this.props.email; }
  get phone(): string | null { return this.props.phone; }
  get type(): VerificationType { return this.props.type; }
  get action(): VerificationAction { return this.props.action; }
  get ipAddress(): string | null { return this.props.ipAddress; }
  get userAgent(): string | null { return this.props.userAgent; }
  get createdAt(): Date { return this.props.createdAt; }

  static toDTO(log: VerificationAuditLog): VerificationAuditLogDTO {
    return {
      logId: log.logId,
      userId: log.userId,
      email: log.email,
      phone: log.phone,
      type: log.type,
      action: log.action,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    };
  }
}

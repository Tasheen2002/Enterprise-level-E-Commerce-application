import {
  VerificationAuditLog,
  VerificationType,
  VerificationAction,
} from "../entities/verification-audit-log.entity";

export interface IVerificationAuditLogRepository {
  save(auditLog: VerificationAuditLog): Promise<void>;
  findByUserId(userId: string, limit?: number): Promise<VerificationAuditLog[]>;
  findByEmail(email: string, limit?: number): Promise<VerificationAuditLog[]>;
  findByTypeAndAction(
    type: VerificationType,
    action: VerificationAction,
    limit?: number
  ): Promise<VerificationAuditLog[]>;
  cleanup(olderThanDays: number): Promise<number>;
}

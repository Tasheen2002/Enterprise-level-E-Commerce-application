import { VerificationAuditLog } from "../entities/verification-audit-log.entity";
import { VerificationType } from "../enums/verification-type.enum";
import { VerificationAction } from "../enums/verification-action.enum";

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

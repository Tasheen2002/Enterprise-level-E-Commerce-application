import { PrismaClient } from "@prisma/client";
import { IVerificationAuditLogRepository } from "../../../domain/repositories/iverification-audit-log.repository";
import {
  VerificationAuditLog,
  VerificationType,
  VerificationAction,
} from "../../../domain/entities/verification-audit-log.entity";

export class VerificationAuditLogRepository
  implements IVerificationAuditLogRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async save(auditLog: VerificationAuditLog): Promise<void> {
    const data = auditLog.toDatabaseRow();

    await this.prisma.$executeRaw`
      INSERT INTO user_management.verification_audit_log
      (log_id, user_id, email, phone, type, action, ip_address, user_agent, created_at)
      VALUES (${data.log_id}, ${data.user_id}, ${data.email}, ${data.phone},
              ${data.type}::user_management.verification_type_enum,
              ${data.action}, ${data.ip_address}, ${data.user_agent}, ${data.created_at})
    `;
  }

  async findByUserId(
    userId: string,
    limit = 100
  ): Promise<VerificationAuditLog[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_audit_log
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.map((row) => VerificationAuditLog.fromDatabaseRow(row));
  }

  async findByEmail(
    email: string,
    limit = 100
  ): Promise<VerificationAuditLog[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_audit_log
      WHERE email = ${email}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.map((row) => VerificationAuditLog.fromDatabaseRow(row));
  }

  async findByTypeAndAction(
    type: VerificationType,
    action: VerificationAction,
    limit = 100
  ): Promise<VerificationAuditLog[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_audit_log
      WHERE type = ${type}::user_management.verification_type_enum
        AND action = ${action}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.map((row) => VerificationAuditLog.fromDatabaseRow(row));
  }

  async cleanup(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.$executeRaw`
      DELETE FROM user_management.verification_audit_log
      WHERE created_at < ${cutoffDate}
    `;

    return result as number;
  }
}

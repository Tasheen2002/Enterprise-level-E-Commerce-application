import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IVerificationAuditLogRepository } from "../../../domain/repositories/iverification-audit-log.repository";
import { VerificationAuditLog } from "../../../domain/entities/verification-audit-log.entity";
import { VerificationType } from "../../../domain/enums/verification-type.enum";
import { VerificationAction } from "../../../domain/enums/verification-action.enum";

export class VerificationAuditLogRepository
  extends PrismaRepository<VerificationAuditLog>
  implements IVerificationAuditLogRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(auditLog: VerificationAuditLog): Promise<void> {
    const data = this.toPersistence(auditLog);

    await this.prisma.$executeRaw`
      INSERT INTO user_management.verification_audit_log
      (log_id, user_id, email, phone, type, action, ip_address, user_agent, created_at)
      VALUES (${data.log_id}, ${data.user_id}, ${data.email}, ${data.phone},
              ${data.type}::user_management.verification_type_enum,
              ${data.action}, ${data.ip_address}, ${data.user_agent}, ${data.created_at})
    `;

    await this.dispatchEvents(auditLog);
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

    return result.map((row) => this.toDomain(row));
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

    return result.map((row) => this.toDomain(row));
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

    return result.map((row) => this.toDomain(row));
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

  private toPersistence(auditLog: VerificationAuditLog): Record<string, any> {
    return {
      log_id: auditLog.logId,
      user_id: auditLog.userId,
      email: auditLog.email,
      phone: auditLog.phone,
      type: auditLog.type,
      action: auditLog.action,
      ip_address: auditLog.ipAddress,
      user_agent: auditLog.userAgent,
      created_at: auditLog.createdAt,
    };
  }

  private toDomain(row: any): VerificationAuditLog {
    return VerificationAuditLog.fromPersistence({
      logId: row.log_id,
      userId: row.user_id,
      email: row.email,
      phone: row.phone,
      type: row.type as VerificationType,
      action: row.action as VerificationAction,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    });
  }
}

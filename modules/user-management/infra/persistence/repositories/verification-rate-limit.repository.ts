import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IVerificationRateLimitRepository } from "../../../domain/repositories/iverification-rate-limit.repository";
import { VerificationRateLimit } from "../../../domain/entities/verification-rate-limit.entity";
import { VerificationType } from "../../../domain/enums/verification-type.enum";

export class VerificationRateLimitRepository
  extends PrismaRepository<VerificationRateLimit>
  implements IVerificationRateLimitRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(rateLimit: VerificationRateLimit): Promise<void> {
    const data = this.toPersistence(rateLimit);

    await this.prisma.$executeRaw`
      INSERT INTO user_management.verification_rate_limits
      (rate_limit_id, user_id, email, phone, type, attempts, last_attempt_at, reset_at)
      VALUES (${data.rate_limit_id}, ${data.user_id}, ${data.email}, ${data.phone},
              ${data.type}::user_management.verification_type_enum,
              ${data.attempts}, ${data.last_attempt_at}, ${data.reset_at})
      ON CONFLICT (rate_limit_id)
      DO UPDATE SET
        attempts = EXCLUDED.attempts,
        last_attempt_at = EXCLUDED.last_attempt_at
    `;

    await this.dispatchEvents(rateLimit);
  }

  async findByUserIdAndType(
    userId: string,
    type: VerificationType
  ): Promise<VerificationRateLimit | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_rate_limits
      WHERE user_id = ${userId}
        AND type = ${type}::user_management.verification_type_enum
        AND reset_at > NOW()
      ORDER BY last_attempt_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async findByEmailAndType(
    email: string,
    type: VerificationType
  ): Promise<VerificationRateLimit | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_rate_limits
      WHERE email = ${email}
        AND type = ${type}::user_management.verification_type_enum
        AND reset_at > NOW()
      ORDER BY last_attempt_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async findByPhoneAndType(
    phone: string,
    type: VerificationType
  ): Promise<VerificationRateLimit | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_rate_limits
      WHERE phone = ${phone}
        AND type = ${type}::user_management.verification_type_enum
        AND reset_at > NOW()
      ORDER BY last_attempt_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.$executeRaw`
      DELETE FROM user_management.verification_rate_limits
      WHERE reset_at <= NOW()
    `;

    return result as number;
  }

  private toPersistence(rateLimit: VerificationRateLimit): Record<string, any> {
    return {
      rate_limit_id: rateLimit.rateLimitId,
      user_id: rateLimit.userId,
      email: rateLimit.email,
      phone: rateLimit.phone,
      type: rateLimit.type,
      attempts: rateLimit.attempts,
      last_attempt_at: rateLimit.lastAttemptAt,
      reset_at: rateLimit.resetAt,
    };
  }

  private toDomain(row: any): VerificationRateLimit {
    return VerificationRateLimit.fromPersistence({
      rateLimitId: row.rate_limit_id,
      userId: row.user_id,
      email: row.email,
      phone: row.phone,
      type: row.type as VerificationType,
      attempts: row.attempts,
      lastAttemptAt: row.last_attempt_at,
      resetAt: row.reset_at,
    });
  }
}

import { PrismaClient } from "@prisma/client";
import { IVerificationRateLimitRepository } from "../../../domain/repositories/iverification-rate-limit.repository";
import {
  VerificationRateLimit,
  VerificationType,
} from "../../../domain/entities/verification-rate-limit.entity";

export class VerificationRateLimitRepository
  implements IVerificationRateLimitRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async save(rateLimit: VerificationRateLimit): Promise<void> {
    const data = rateLimit.toDatabaseRow();

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

    return VerificationRateLimit.fromDatabaseRow(result[0]);
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

    return VerificationRateLimit.fromDatabaseRow(result[0]);
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

    return VerificationRateLimit.fromDatabaseRow(result[0]);
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.$executeRaw`
      DELETE FROM user_management.verification_rate_limits
      WHERE reset_at <= NOW()
    `;

    return result as number;
  }
}

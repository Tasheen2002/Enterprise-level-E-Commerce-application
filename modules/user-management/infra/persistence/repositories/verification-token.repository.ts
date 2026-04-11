import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IVerificationTokenRepository } from "../../../domain/repositories/iverification-token.repository";
import { VerificationToken } from "../../../domain/entities/verification-token.entity";
import { VerificationType } from "../../../domain/enums/verification-type.enum";

export class VerificationTokenRepository
  extends PrismaRepository<VerificationToken>
  implements IVerificationTokenRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(token: VerificationToken): Promise<void> {
    const data = this.toPersistence(token);

    await this.prisma.$executeRaw`
      INSERT INTO user_management.verification_tokens
      (token_id, user_id, token, type, email, phone, expires_at, used_at, created_at)
      VALUES (${data.token_id}, ${data.user_id}, ${data.token}, ${data.type}::user_management.verification_type_enum,
              ${data.email}, ${data.phone}, ${data.expires_at}, ${data.used_at}, ${data.created_at})
      ON CONFLICT (token_id)
      DO UPDATE SET
        used_at = EXCLUDED.used_at
    `;

    await this.dispatchEvents(token);
  }

  async findByToken(
    token: string,
    type: VerificationType
  ): Promise<VerificationToken | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_tokens
      WHERE token = ${token} AND type = ${type}::user_management.verification_type_enum
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async findByUserIdAndType(
    userId: string,
    type: VerificationType
  ): Promise<VerificationToken | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_tokens
      WHERE user_id = ${userId} AND type = ${type}::user_management.verification_type_enum
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async findActiveByUserIdAndType(
    userId: string,
    type: VerificationType
  ): Promise<VerificationToken | null> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM user_management.verification_tokens
      WHERE user_id = ${userId}
        AND type = ${type}::user_management.verification_type_enum
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async deleteByUserIdAndType(
    userId: string,
    type: VerificationType
  ): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM user_management.verification_tokens
      WHERE user_id = ${userId} AND type = ${type}::user_management.verification_type_enum
    `;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.$executeRaw`
      DELETE FROM user_management.verification_tokens
      WHERE expires_at <= NOW()
    `;

    return result as number;
  }

  async deleteUsed(): Promise<number> {
    const result = await this.prisma.$executeRaw`
      DELETE FROM user_management.verification_tokens
      WHERE used_at IS NOT NULL
    `;

    return result as number;
  }

  private toPersistence(token: VerificationToken): Record<string, any> {
    return {
      token_id: token.tokenId,
      user_id: token.userId,
      token: token.token,
      type: token.type,
      email: token.email,
      phone: token.phone,
      expires_at: token.expiresAt,
      used_at: token.usedAt,
      created_at: token.createdAt,
    };
  }

  private toDomain(row: any): VerificationToken {
    return VerificationToken.fromPersistence({
      tokenId: row.token_id,
      userId: row.user_id,
      token: row.token,
      type: row.type as VerificationType,
      email: row.email,
      phone: row.phone,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    });
  }
}

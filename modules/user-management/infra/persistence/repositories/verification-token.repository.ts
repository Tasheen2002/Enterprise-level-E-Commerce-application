import { PrismaClient } from "@prisma/client";
import { IVerificationTokenRepository } from "../../../domain/repositories/iverification-token.repository";
import {
  VerificationToken,
  VerificationType,
} from "../../../domain/entities/verification-token.entity";

export class VerificationTokenRepository
  implements IVerificationTokenRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async save(token: VerificationToken): Promise<void> {
    const data = token.toDatabaseRow();

    await this.prisma.$executeRaw`
      INSERT INTO user_management.verification_tokens
      (token_id, user_id, token, type, email, phone, expires_at, used_at, created_at)
      VALUES (${data.token_id}, ${data.user_id}, ${data.token}, ${data.type}::user_management.verification_type_enum,
              ${data.email}, ${data.phone}, ${data.expires_at}, ${data.used_at}, ${data.created_at})
      ON CONFLICT (token_id)
      DO UPDATE SET
        used_at = EXCLUDED.used_at
    `;
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

    return VerificationToken.fromDatabaseRow(result[0]);
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

    return VerificationToken.fromDatabaseRow(result[0]);
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

    return VerificationToken.fromDatabaseRow(result[0]);
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
}

import { PrismaClient } from "@prisma/client";
import {
  ITwoFactorBackupCodeRepository,
  TwoFactorBackupCodeRecord,
} from "../../../domain/repositories/itwo-factor-backup-code.repository";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class TwoFactorBackupCodeRepository
  implements ITwoFactorBackupCodeRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Atomic replacement: drop everything the user has + insert the new
   * batch. Done in a single transaction so a partial regenerate can't
   * leave the user with a mix of old and new codes (which would be a
   * subtle security regression — old "regenerated" codes still
   * working).
   */
  async replaceForUser(userId: UserId, codeHashes: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.twoFactorBackupCode.deleteMany({
        where: { userId: userId.getValue() },
      }),
      this.prisma.twoFactorBackupCode.createMany({
        data: codeHashes.map((codeHash) => ({
          userId: userId.getValue(),
          codeHash,
        })),
      }),
    ]);
  }

  async findUnusedByUser(
    userId: UserId,
  ): Promise<TwoFactorBackupCodeRecord[]> {
    const rows = await this.prisma.twoFactorBackupCode.findMany({
      where: {
        userId: userId.getValue(),
        usedAt: null,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      codeHash: r.codeHash,
      usedAt: r.usedAt,
      createdAt: r.createdAt,
    }));
  }

  async markUsed(codeId: string): Promise<void> {
    await this.prisma.twoFactorBackupCode.update({
      where: { id: codeId },
      data: { usedAt: new Date() },
    });
  }

  async deleteAllForUser(userId: UserId): Promise<void> {
    await this.prisma.twoFactorBackupCode.deleteMany({
      where: { userId: userId.getValue() },
    });
  }
}

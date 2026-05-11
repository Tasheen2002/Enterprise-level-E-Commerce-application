import { PrismaClient } from "@prisma/client";
import { ISessionRepository } from "../../../domain/repositories/isession.repository";
import { MemberSession } from "../../../domain/entities/member-session.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToDomain(record: any): MemberSession {
    return MemberSession.create({
      id: record.id,
      userId: UserId.fromString(record.userId),
      refreshTokenHash: record.refreshTokenHash,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      deviceType: record.deviceType,
      browser: record.browser,
      os: record.os,
      isRevoked: record.isRevoked,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async create(session: MemberSession): Promise<void> {
    await this.prisma.memberSession.create({
      data: {
        id: session.id,
        userId: session.userId.getValue(),
        refreshTokenHash: session.refreshTokenHash,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        isRevoked: session.isRevoked,
        expiresAt: session.expiresAt,
      },
    });
  }

  async update(session: MemberSession): Promise<void> {
    if (!session.id) throw new Error("Cannot update session without ID");
    await this.prisma.memberSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: session.refreshTokenHash,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        isRevoked: session.isRevoked,
        expiresAt: session.expiresAt,
      },
    });
  }

  async findByTokenHash(hash: string): Promise<MemberSession | null> {
    const record = await this.prisma.memberSession.findUnique({
      where: { refreshTokenHash: hash },
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  async findByUserId(userId: UserId): Promise<MemberSession[]> {
    const records = await this.prisma.memberSession.findMany({
      where: { 
        userId: userId.getValue(),
        expiresAt: { gt: new Date() },
        isRevoked: false,
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map(r => this.mapToDomain(r));
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.memberSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  async revokeAllForUser(userId: UserId, exceptSessionId?: string): Promise<void> {
    const whereClause: any = {
      userId: userId.getValue(),
      isRevoked: false,
    };
    if (exceptSessionId) {
      whereClause.id = { not: exceptSessionId };
    }
    
    await this.prisma.memberSession.updateMany({
      where: whereClause,
      data: { isRevoked: true },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.memberSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}

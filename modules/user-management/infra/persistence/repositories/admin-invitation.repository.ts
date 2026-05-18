import { PrismaClient } from '@prisma/client';
import { IAdminInvitationRepository } from '../../../domain/repositories/iadmin-invitation.repository';
import {
  AdminInvitation,
  AdminInvitationProps,
  InvitationStatus,
} from '../../../domain/entities/admin-invitation.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { UserRole } from '../../../domain/value-objects/user-role.vo';

export class AdminInvitationRepository implements IAdminInvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(invitation: AdminInvitation): Promise<void> {
    await this.prisma.adminInvitation.upsert({
      where: { id: invitation.id },
      create: {
        id: invitation.id,
        email: invitation.email.getValue(),
        role: invitation.role as any,
        tokenHash: invitation.tokenHash,
        status: invitation.status as any,
        invitedById: invitation.invitedById.getValue(),
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
      },
      update: {
        status: invitation.status as any,
        acceptedAt: invitation.acceptedAt,
      },
    });
  }

  async findById(id: string): Promise<AdminInvitation | null> {
    const row = await this.prisma.adminInvitation.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<AdminInvitation | null> {
    const row = await this.prisma.adminInvitation.findUnique({
      where: { tokenHash },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<AdminInvitation[]> {
    const rows = await this.prisma.adminInvitation.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(row => this.toDomain(row));
  }

  async findAllPending(): Promise<AdminInvitation[]> {
    const rows = await this.prisma.adminInvitation.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(row => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.adminInvitation.delete({ where: { id } });
  }

  // --- Private mapper ---

  private toDomain(row: any): AdminInvitation {
    const props: AdminInvitationProps = {
      id: row.id,
      email: Email.create(row.email),
      role: UserRole.fromString(row.role),
      tokenHash: row.tokenHash,
      status: row.status as InvitationStatus,
      invitedById: UserId.fromString(row.invitedById),
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return AdminInvitation.fromPersistence(props);
  }
}

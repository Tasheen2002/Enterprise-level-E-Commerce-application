import { AdminInvitation } from '../entities/admin-invitation.entity';

export interface IAdminInvitationRepository {
  save(invitation: AdminInvitation): Promise<void>;
  findById(id: string): Promise<AdminInvitation | null>;
  findByTokenHash(tokenHash: string): Promise<AdminInvitation | null>;
  findByEmail(email: string): Promise<AdminInvitation[]>;
  findAllPending(): Promise<AdminInvitation[]>;
  delete(id: string): Promise<void>;
}

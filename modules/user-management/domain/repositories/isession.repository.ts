import { MemberSession } from "../entities/member-session.entity";
import { UserId } from "../value-objects/user-id.vo";

export interface ISessionRepository {
  create(session: MemberSession): Promise<void>;
  update(session: MemberSession): Promise<void>;
  findByTokenHash(hash: string): Promise<MemberSession | null>;
  findByUserId(userId: UserId): Promise<MemberSession[]>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: UserId, exceptSessionId?: string): Promise<void>;
  deleteExpired(): Promise<void>;
}

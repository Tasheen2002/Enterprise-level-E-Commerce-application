import { User } from "../entities/user.entity";
import { UserId } from "../value-objects/user-id.vo";
import { Email } from "../value-objects/email.vo";

export interface IUserRepository {
  // Core CRUD operations
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;

  // Query operations
  findByPhone(phone: string): Promise<User | null>;
  findActiveUsers(limit?: number, offset?: number): Promise<User[]>;
  findGuestUsers(limit?: number, offset?: number): Promise<User[]>;
  findUnverifiedUsers(limit?: number, offset?: number): Promise<User[]>;

  // Business operations
  existsByEmail(email: Email): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
  countActiveUsers(): Promise<number>;
  countGuestUsers(): Promise<number>;

  // Batch operations
  findByIds(ids: UserId[]): Promise<User[]>;
  deleteInactiveSince(date: Date): Promise<number>;
}

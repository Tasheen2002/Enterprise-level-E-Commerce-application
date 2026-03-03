import { User, UserRole, UserStatus } from "../entities/user.entity";
import { UserId } from "../value-objects/user-id.vo";
import { Email } from "../value-objects/email.vo";

export interface FindAllWithFiltersOptions {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  page: number;
  limit: number;
  sortBy: "createdAt" | "email";
  sortOrder: "asc" | "desc";
}

/** Plain DTO returned by the read-side query — no domain entity hydration. */
export interface UserListItemDTO {
  userId: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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

  /** Read-side: returns plain DTOs directly — no entity hydration. */
  findAllWithFilters(options: FindAllWithFiltersOptions): Promise<{ users: UserListItemDTO[]; total: number }>;

  // Business operations
  existsByEmail(email: Email): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
  countActiveUsers(): Promise<number>;
  countGuestUsers(): Promise<number>;

  // Batch operations
  findByIds(ids: UserId[]): Promise<User[]>;
  deleteInactiveSince(date: Date): Promise<number>;
}

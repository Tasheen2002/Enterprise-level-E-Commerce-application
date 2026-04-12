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

/** Projection returned by the read-side list query — avoids full entity hydration. */
export interface UserListItem {
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
  delete(id: UserId): Promise<void>;

  // Query operations
  findByPhone(phone: string): Promise<User | null>;

  /** Read-side list projection — no full entity hydration. */
  findAllWithFilters(options: FindAllWithFiltersOptions): Promise<{ users: UserListItem[]; total: number }>;

  // Business operations
  existsByEmail(email: Email): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;

  // Batch operations
  findByIds(ids: UserId[]): Promise<User[]>;
}

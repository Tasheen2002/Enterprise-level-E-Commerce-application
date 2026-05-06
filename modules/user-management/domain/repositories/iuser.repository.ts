import { User } from '../entities/user.entity';
import { UserRole } from '../value-objects/user-role.vo';
import { UserStatus } from '../value-objects/user-status.vo';
import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';
import {
  PaginatedResult,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

// ============================================================================
// Filter / Projection types
// ============================================================================

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'email';
  sortOrder: 'asc' | 'desc';
}

/** Projection returned by read-side list queries — avoids full entity hydration. */
export interface UserListItem {
  userId: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface IUserRepository {
  // Core CRUD operations
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  delete(id: UserId): Promise<void>;

  // Query operations
  findByPhone(phone: Phone): Promise<User | null>;
  findAllWithFilters(filters: UserFilters): Promise<PaginatedResult<UserListItem>>;

  // Existence checks
  existsByEmail(email: Email): Promise<boolean>;
  existsByPhone(phone: Phone): Promise<boolean>;

  // Batch operations
  findByIds(ids: UserId[]): Promise<User[]>;
}

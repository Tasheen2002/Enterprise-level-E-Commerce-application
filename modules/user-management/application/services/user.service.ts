import { IUserRepository, UserListItem } from '../../domain/repositories/iuser.repository';
import { User, UserDTO } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { UserStatus } from '../../domain/value-objects/user-status.vo';
import { PaginatedResult } from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';
import { UserNotFoundError } from '../../domain/errors/user-management.errors';

interface ListUsersParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export class UserService {
  constructor(private readonly userRepository: IUserRepository) { }

  async getUserById(userId: string): Promise<UserDTO> {
    const user = await this.getUserEntity(userId);
    return User.toDTO(user);
  }

  async listUsers(params: ListUsersParams): Promise<PaginatedResult<UserListItem>> {
    return this.userRepository.findAllWithFilters({
      search: params.search,
      role: params.role,
      status: params.status,
      emailVerified: params.emailVerified,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      sortBy: params.sortBy ?? 'createdAt',
      sortOrder: params.sortOrder ?? 'desc',
    });
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserDTO> {
    const user = await this.getUserEntity(userId);
    user.updateRole(role);
    await this.userRepository.save(user);
    return User.toDTO(user);
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<UserDTO> {
    const user = await this.getUserEntity(userId);
    switch (status) {
      case UserStatus.ACTIVE: user.activate(); break;
      case UserStatus.INACTIVE: user.deactivate(); break;
      case UserStatus.BLOCKED: user.block(); break;
    }
    await this.userRepository.save(user);
    return User.toDTO(user);
  }

  async toggleEmailVerified(userId: string, isVerified: boolean): Promise<UserDTO> {
    const user = await this.getUserEntity(userId);
    user.setEmailVerified(isVerified);
    await this.userRepository.save(user);
    return User.toDTO(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.getUserEntity(userId);
    await this.userRepository.delete(user.id);
  }

  // --- Private helpers ---

  private async getUserEntity(userId: string): Promise<User> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }
}

import { IUserRepository, UserListItem } from '../../domain/repositories/iuser.repository';
import { User, UserDTO } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { UserStatus } from '../../domain/value-objects/user-status.vo';
import { PaginatedResult } from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';
import { AdminSafetyError, UserNotFoundError } from '../../domain/errors/user-management.errors';

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

  async updateUserRole(userId: string, role: UserRole, actingUserId: string): Promise<UserDTO> {
    const user = await this.getUserEntity(userId);
    if (role !== UserRole.ADMIN) await this.assertAdminAccessRemovable(user, actingUserId, 'demote');
    user.updateRole(role);
    await this.userRepository.save(user);
    return User.toDTO(user);
  }

  async updateUserStatus(
    userId: string,
    status: UserStatus,
    actingUserId: string,
  ): Promise<UserDTO> {
    const user = await this.getUserEntity(userId);
    if (status !== UserStatus.ACTIVE) {
      await this.assertAdminAccessRemovable(user, actingUserId, 'deactivate');
    }
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

  async deleteUser(userId: string, actingUserId: string): Promise<void> {
    const user = await this.getUserEntity(userId);
    if (user.id.getValue() === actingUserId) {
      throw new AdminSafetyError('You cannot delete your own account from the admin panel');
    }
    await this.assertAdminAccessRemovable(user, actingUserId, 'delete');
    await this.userRepository.delete(user.id);
  }

  // --- Private helpers ---

  // Refuses an action that would remove admin access from the acting admin
  // themselves or from the last active administrator.
  private async assertAdminAccessRemovable(
    target: User,
    actingUserId: string,
    action: 'demote' | 'deactivate' | 'delete',
  ): Promise<void> {
    if (target.role !== UserRole.ADMIN) return;
    if (target.id.getValue() === actingUserId) {
      throw new AdminSafetyError(`You cannot ${action} your own administrator account`);
    }
    if (target.status !== UserStatus.ACTIVE) return;
    const activeAdmins = await this.userRepository.findAllWithFilters({
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      page: 1,
      limit: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    if (activeAdmins.total <= 1) {
      throw new AdminSafetyError(`Cannot ${action} the last active administrator`);
    }
  }

  private async getUserEntity(userId: string): Promise<User> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }
}

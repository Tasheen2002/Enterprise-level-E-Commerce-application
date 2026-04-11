import { IUserRepository, FindAllWithFiltersOptions, UserListItemDTO } from '../../domain/repositories/iuser.repository';
import { User, UserDTO } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import {
  UserNotFoundError,
} from '../../domain/errors/user-management.errors';

export interface ListUsersResult {
  users: UserListItemDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUserById(userId: string): Promise<UserDTO> {
    const user = await this._getUserEntity(userId);
    return User.toDTO(user);
  }

  async listUsers(params: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    emailVerified?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'email';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ListUsersResult> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    const { users, total } = await this.userRepository.findAllWithFilters({
      search: params.search,
      role: params.role,
      status: params.status,
      emailVerified: params.emailVerified,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return {
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserDTO> {
    const user = await this._getUserEntity(userId);
    user.updateRole(role);
    await this.userRepository.save(user);
    return User.toDTO(user);
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<UserDTO> {
    const user = await this._getUserEntity(userId);
    switch (status) {
      case UserStatus.ACTIVE: user.activate(); break;
      case UserStatus.INACTIVE: user.deactivate(); break;
      case UserStatus.BLOCKED: user.block(); break;
    }
    await this.userRepository.save(user);
    return User.toDTO(user);
  }

  async toggleEmailVerified(userId: string, isVerified: boolean): Promise<UserDTO> {
    const user = await this._getUserEntity(userId);
    user.setEmailVerified(isVerified);
    await this.userRepository.save(user);
    return User.toDTO(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this._getUserEntity(userId);
    user.markAsDeleted();
    await this.userRepository.delete(user.id);
  }

  private async _getUserEntity(userId: string): Promise<User> {
    const user = await this.userRepository.findById(UserId.fromString(userId));
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }
}

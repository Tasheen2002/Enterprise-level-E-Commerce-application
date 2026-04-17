import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { UserService } from '../services/user.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { PaginatedResult } from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';
import { UserListItem } from '../../domain/repositories/iuser.repository';

export interface ListUsersQuery extends IQuery {
  readonly search?: string;
  readonly role?: UserRole;
  readonly status?: UserStatus;
  readonly emailVerified?: boolean;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: 'createdAt' | 'email';
  readonly sortOrder?: 'asc' | 'desc';
}

export class ListUsersHandler implements IQueryHandler<ListUsersQuery, PaginatedResult<UserListItem>> {
  constructor(private readonly userService: UserService) {}

  async handle(query: ListUsersQuery): Promise<PaginatedResult<UserListItem>> {
    return this.userService.listUsers({
      search: query.search,
      role: query.role,
      status: query.status,
      emailVerified: query.emailVerified,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}

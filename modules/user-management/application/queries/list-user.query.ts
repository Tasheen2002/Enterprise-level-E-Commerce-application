import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { UserService } from '../services/user.service';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { UserStatus } from '../../domain/value-objects/user-status.vo';
import { PaginatedResult } from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';
import { UserListItem } from '../../domain/repositories/iuser.repository';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from '../../domain/constants/pagination.constants';

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
  constructor(private readonly userService: UserService) { }

  async handle(query: ListUsersQuery): Promise<PaginatedResult<UserListItem>> {
    return this.userService.listUsers({
      search: query.search,
      role: query.role,
      status: query.status,
      emailVerified: query.emailVerified,
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}

import { UserService, ListUsersResult } from '../services/user.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface ListUsersQuery extends IQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export class ListUsersHandler implements IQueryHandler<ListUsersQuery, ListUsersResult> {
  constructor(private readonly userService: UserService) {}

  async handle(query: ListUsersQuery): Promise<ListUsersResult> {
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

export { ListUsersResult };

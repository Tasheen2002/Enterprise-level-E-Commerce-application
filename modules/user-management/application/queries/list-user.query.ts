import { UserService, ListUsersResult } from '../services/user.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface ListUsersInput extends IQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export class ListUsersHandler implements IQueryHandler<ListUsersInput, ListUsersResult> {
  constructor(private readonly userService: UserService) {}

  async handle(input: ListUsersInput): Promise<ListUsersResult> {
    return this.userService.listUsers({
      search: input.search,
      role: input.role,
      status: input.status,
      emailVerified: input.emailVerified,
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    });
  }
}

export { ListUsersResult };

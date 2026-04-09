import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { QueryResult } from '../../../../packages/core/src/application/query-result';

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

export interface ListUsersResult {
  users: Array<{
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
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ListUsersHandler implements IQueryHandler<
  ListUsersInput,
  QueryResult<ListUsersResult>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    input: ListUsersInput
  ): Promise<QueryResult<ListUsersResult>> {
    const page = input.page || 1;
    const limit = input.limit || 20;
    const sortBy = input.sortBy || 'createdAt';
    const sortOrder = input.sortOrder || 'desc';

    const { users, total } = await this.userRepository.findAllWithFilters({
      search: input.search,
      role: input.role,
      status: input.status,
      emailVerified: input.emailVerified,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return QueryResult.success({
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  }
}

import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { UserRole, UserStatus } from "../../domain/entities/user.entity";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface ListUsersQuery extends IQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "email";
  sortOrder?: "asc" | "desc";
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
  ListUsersQuery,
  QueryResult<ListUsersResult>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(query: ListUsersQuery): Promise<QueryResult<ListUsersResult>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const sortBy = query.sortBy || "createdAt";
      const sortOrder = query.sortOrder || "desc";

      if (page < 1) {
        return QueryResult.failure<ListUsersResult>(
          "Page number must be greater than 0",
        );
      }

      if (limit < 1 || limit > 100) {
        return QueryResult.failure<ListUsersResult>(
          "Limit must be between 1 and 100",
        );
      }

      // Returns plain DTOs — no entity hydration
      const { users, total } = await this.userRepository.findAllWithFilters({
        search: query.search,
        role: query.role,
        status: query.status,
        emailVerified: query.emailVerified,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const totalPages = Math.ceil(total / limit);

      return QueryResult.success<ListUsersResult>({
        users,
        pagination: { total, page, limit, totalPages },
      });
    } catch (error) {
      console.error("[ListUsersHandler] Error:", error);

      if (error instanceof Error) {
        return QueryResult.failure<ListUsersResult>(
          "Failed to retrieve users list",
        );
      }

      return QueryResult.failure<ListUsersResult>(
        "An unexpected error occurred while retrieving users",
      );
    }
  }
}

import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { ListUsersQuery, ListUsersResult } from "./list-user.query";

export class ListUsersHandler implements IQueryHandler<ListUsersQuery, QueryResult<ListUsersResult>> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(query: ListUsersQuery): Promise<QueryResult<ListUsersResult>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const sortBy = query.sortBy || "createdAt";
      const sortOrder = query.sortOrder || "desc";

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

      return QueryResult.success<ListUsersResult>({
        users,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      return QueryResult.failure<ListUsersResult>(
        error instanceof Error ? error.message : "Failed to retrieve users list",
      );
    }
  }
}

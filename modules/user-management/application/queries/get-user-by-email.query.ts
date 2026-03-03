import { AuthenticationService } from "../services/authentication.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetUserByEmailQuery extends IQuery {
  email: string;
}

export interface GetUserByEmailResult {
  userId: string;
  emailVerified: boolean;
}

export class GetUserByEmailHandler
  implements IQueryHandler<GetUserByEmailQuery, QueryResult<GetUserByEmailResult | null>>
{
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    query: GetUserByEmailQuery,
  ): Promise<QueryResult<GetUserByEmailResult | null>> {
    try {
      if (!query.email) {
        return QueryResult.failure<GetUserByEmailResult | null>(
          "Email is required",
        );
      }

      const user = await this.authService.getUserByEmail(query.email);

      return QueryResult.success<GetUserByEmailResult | null>(user);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<GetUserByEmailResult | null>(
          error.message || "Failed to get user by email",
        );
      }
      return QueryResult.failure<GetUserByEmailResult | null>(
        "An unexpected error occurred while retrieving user by email",
      );
    }
  }
}

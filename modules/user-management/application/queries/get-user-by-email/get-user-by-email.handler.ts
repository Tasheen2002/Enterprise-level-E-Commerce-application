import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { AuthenticationService } from "../../services/authentication.service";
import {
  GetUserByEmailQuery,
  GetUserByEmailResult,
} from "./get-user-by-email.query";

export class GetUserByEmailHandler implements IQueryHandler<
  GetUserByEmailQuery,
  QueryResult<GetUserByEmailResult>
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    query: GetUserByEmailQuery,
  ): Promise<QueryResult<GetUserByEmailResult>> {
    try {
      const user = await this.authService.getUserByEmail(query.email);
      return QueryResult.success<GetUserByEmailResult>(user);
    } catch (error) {
      return QueryResult.failure<GetUserByEmailResult>(
        error instanceof Error ? error.message : "Failed to get user by email",
      );
    }
  }
}

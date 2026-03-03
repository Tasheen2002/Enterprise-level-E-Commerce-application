import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { AuthenticationService } from "../services/authentication.service";
import { GetUserByEmailQuery, GetUserByEmailResult } from "./get-user-by-email.query";

export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, QueryResult<GetUserByEmailResult | null>> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(query: GetUserByEmailQuery): Promise<QueryResult<GetUserByEmailResult | null>> {
    try {
      const user = await this.authService.getUserByEmail(query.email);
      return QueryResult.success<GetUserByEmailResult | null>(user);
    } catch (error) {
      return QueryResult.failure<GetUserByEmailResult | null>(
        error instanceof Error ? error.message : "Failed to get user by email",
      );
    }
  }
}

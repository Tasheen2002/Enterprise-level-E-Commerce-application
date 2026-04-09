import { AuthenticationService } from '../services/authentication.service';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { QueryResult } from '../../../../packages/core/src/application/query-result';

export interface GetUserByEmailInput extends IQuery {
  email: string;
}

export class GetUserByEmailHandler implements IQueryHandler<
  GetUserByEmailInput,
  QueryResult<{ userId: string; emailVerified: boolean }>
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(
    input: GetUserByEmailInput
  ): Promise<QueryResult<{ userId: string; emailVerified: boolean }>> {
    const user = await this.authService.getUserByEmail(input.email);
    return QueryResult.success(user);
  }
}

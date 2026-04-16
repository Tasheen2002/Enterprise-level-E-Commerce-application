import { AuthenticationService } from '../services/authentication.service';
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';

export interface GetUserByEmailQuery extends IQuery {
  readonly email: string;
}

export class GetUserByEmailHandler implements IQueryHandler<
  GetUserByEmailQuery,
  QueryResult<{ userId: string; emailVerified: boolean }>
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(query: GetUserByEmailQuery): Promise<QueryResult<{ userId: string; emailVerified: boolean }>> {
    try {
      const data = await this.authService.getUserByEmail(query.email);
      return QueryResult.success(data);
    } catch (error) {
      return QueryResult.fromError(error);
    }
  }
}

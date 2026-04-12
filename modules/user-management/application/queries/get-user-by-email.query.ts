import { AuthenticationService } from '../services/authentication.service';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface GetUserByEmailQuery extends IQuery {
  email: string;
}

export class GetUserByEmailHandler implements IQueryHandler<
  GetUserByEmailQuery,
  { userId: string; emailVerified: boolean }
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(query: GetUserByEmailQuery): Promise<{ userId: string; emailVerified: boolean }> {
    return this.authService.getUserByEmail(query.email);
  }
}

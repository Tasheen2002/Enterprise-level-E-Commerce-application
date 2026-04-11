import { AuthenticationService } from '../services/authentication.service';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface GetUserByEmailInput extends IQuery {
  email: string;
}

export class GetUserByEmailHandler implements IQueryHandler<
  GetUserByEmailInput,
  { userId: string; emailVerified: boolean }
> {
  constructor(private readonly authService: AuthenticationService) {}

  async handle(input: GetUserByEmailInput): Promise<{ userId: string; emailVerified: boolean }> {
    return this.authService.getUserByEmail(input.email);
  }
}

import { UserService } from '../services/user.service';
import { UserDTO } from '../../domain/entities/user.entity';
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';

export interface GetUserDetailsQuery extends IQuery {
  readonly userId: string;
}

export class GetUserDetailsHandler implements IQueryHandler<GetUserDetailsQuery, QueryResult<UserDTO>> {
  constructor(private readonly userService: UserService) {}

  async handle(query: GetUserDetailsQuery): Promise<QueryResult<UserDTO>> {
    try {
      const data = await this.userService.getUserById(query.userId);
      return QueryResult.success(data);
    } catch (error) {
      return QueryResult.fromError(error);
    }
  }
}

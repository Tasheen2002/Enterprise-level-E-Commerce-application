import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { UserService } from '../services/user.service';
import { UserDTO } from '../../domain/entities/user.entity';

export interface GetUserDetailsQuery extends IQuery {
  readonly userId: string;
}

export class GetUserDetailsHandler implements IQueryHandler<GetUserDetailsQuery, UserDTO> {
  constructor(private readonly userService: UserService) {}

  async handle(query: GetUserDetailsQuery): Promise<UserDTO> {
    return this.userService.getUserById(query.userId);
  }
}

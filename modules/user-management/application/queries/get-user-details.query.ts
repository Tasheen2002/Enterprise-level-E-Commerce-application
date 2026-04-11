import { UserService } from '../services/user.service';
import { UserDTO } from '../../domain/entities/user.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface GetUserDetailsInput extends IQuery {
  userId: string;
}

export class GetUserDetailsHandler implements IQueryHandler<GetUserDetailsInput, UserDTO> {
  constructor(private readonly userService: UserService) {}

  async handle(input: GetUserDetailsInput): Promise<UserDTO> {
    return this.userService.getUserById(input.userId);
  }
}

import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { IAddressRepository } from '../../domain/repositories/iaddress.repository';
import { User, UserDTO } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserNotFoundError } from '../../domain/errors/user-management.errors';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { QueryResult } from '../../../../packages/core/src/application/query-result';

export interface GetUserDetailsInput extends IQuery {
  userId: string;
}

export class GetUserDetailsHandler implements IQueryHandler<
  GetUserDetailsInput,
  QueryResult<UserDTO>
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly addressRepository: IAddressRepository,
  ) {}

  async handle(
    input: GetUserDetailsInput
  ): Promise<QueryResult<UserDTO>> {
    const userId = UserId.fromString(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return QueryResult.success(User.toDTO(user));
  }
}

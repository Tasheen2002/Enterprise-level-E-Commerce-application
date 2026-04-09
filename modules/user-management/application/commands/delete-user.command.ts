import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserNotFoundError } from '../../domain/errors/user-management.errors';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface DeleteUserInput extends ICommand {
  userId: string;
}

export class DeleteUserHandler implements ICommandHandler<
  DeleteUserInput,
  CommandResult<void>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    input: DeleteUserInput
  ): Promise<CommandResult<void>> {
    const userId = UserId.fromString(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    await this.userRepository.delete(userId);

    return CommandResult.success(undefined);
  }
}

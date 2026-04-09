import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { User, UserDTO } from '../../domain/entities/user.entity';
import { UserNotFoundError } from '../../domain/errors/user-management.errors';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface ToggleUserEmailVerifiedInput extends ICommand {
  userId: string;
  isVerified: boolean;
  reason?: string;
}

export class ToggleUserEmailVerifiedHandler implements ICommandHandler<
  ToggleUserEmailVerifiedInput,
  CommandResult<UserDTO>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    input: ToggleUserEmailVerifiedInput
  ): Promise<CommandResult<UserDTO>> {
    const userId = UserId.fromString(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    user.setEmailVerified(input.isVerified);
    await this.userRepository.save(user);

    return CommandResult.success(User.toDTO(user));
  }
}

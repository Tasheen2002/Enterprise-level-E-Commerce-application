import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { User, UserDTO } from '../../domain/entities/user.entity';
import { UserNotFoundError } from '../../domain/errors/user-management.errors';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface UpdateUserStatusInput extends ICommand {
  userId: string;
  status: UserStatus;
  notes?: string;
}

export class UpdateUserStatusHandler implements ICommandHandler<
  UpdateUserStatusInput,
  CommandResult<UserDTO>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(
    input: UpdateUserStatusInput
  ): Promise<CommandResult<UserDTO>> {
    const userId = UserId.fromString(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    switch (input.status) {
      case UserStatus.ACTIVE:
        user.activate();
        break;
      case UserStatus.INACTIVE:
        user.deactivate();
        break;
      case UserStatus.BLOCKED:
        user.block();
        break;
    }

    await this.userRepository.save(user);

    return CommandResult.success(User.toDTO(user));
  }
}

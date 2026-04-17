import { UserService } from '../services/user.service';
import { UserDTO } from '../../domain/entities/user.entity';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface ToggleUserEmailVerifiedCommand extends ICommand {
  readonly userId: string;
  readonly isVerified: boolean;
  readonly reason?: string;
}

export class ToggleUserEmailVerifiedHandler implements ICommandHandler<
  ToggleUserEmailVerifiedCommand,
  CommandResult<UserDTO>
> {
  constructor(private readonly userService: UserService) {}

  async handle(command: ToggleUserEmailVerifiedCommand): Promise<CommandResult<UserDTO>> {
    const dto = await this.userService.toggleEmailVerified(command.userId, command.isVerified);
    return CommandResult.success(dto);
  }
}

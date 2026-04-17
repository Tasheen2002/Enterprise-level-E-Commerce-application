import { UserService } from '../services/user.service';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { UserDTO } from '../../domain/entities/user.entity';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface UpdateUserStatusCommand extends ICommand {
  readonly userId: string;
  readonly status: UserStatus;
  readonly notes?: string;
}

export class UpdateUserStatusHandler implements ICommandHandler<UpdateUserStatusCommand, CommandResult<UserDTO>> {
  constructor(private readonly userService: UserService) {}

  async handle(command: UpdateUserStatusCommand): Promise<CommandResult<UserDTO>> {
    const dto = await this.userService.updateUserStatus(command.userId, command.status);
    return CommandResult.success(dto);
  }
}

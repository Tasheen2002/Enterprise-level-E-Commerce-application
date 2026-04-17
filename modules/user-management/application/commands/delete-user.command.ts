import { UserService } from '../services/user.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface DeleteUserCommand extends ICommand {
  readonly userId: string;
}

export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, CommandResult<void>> {
  constructor(private readonly userService: UserService) {}

  async handle(command: DeleteUserCommand): Promise<CommandResult<void>> {
    await this.userService.deleteUser(command.userId);
    return CommandResult.success();
  }
}

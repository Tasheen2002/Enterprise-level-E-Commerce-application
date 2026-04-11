import { UserService } from '../services/user.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface DeleteUserInput extends ICommand {
  userId: string;
}

export class DeleteUserHandler implements ICommandHandler<DeleteUserInput, CommandResult<void>> {
  constructor(private readonly userService: UserService) {}

  async handle(input: DeleteUserInput): Promise<CommandResult<void>> {
    await this.userService.deleteUser(input.userId);
    return CommandResult.success();
  }
}

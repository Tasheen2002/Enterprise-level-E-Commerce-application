import { UserService } from '../services/user.service';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { UserDTO } from '../../domain/entities/user.entity';
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

export class UpdateUserStatusHandler implements ICommandHandler<UpdateUserStatusInput, CommandResult<UserDTO>> {
  constructor(private readonly userService: UserService) {}

  async handle(input: UpdateUserStatusInput): Promise<CommandResult<UserDTO>> {
    const dto = await this.userService.updateUserStatus(input.userId, input.status);
    return CommandResult.success(dto);
  }
}

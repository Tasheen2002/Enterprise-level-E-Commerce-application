import { UserService } from '../services/user.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserDTO } from '../../domain/entities/user.entity';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface UpdateUserRoleInput extends ICommand {
  userId: string;
  role: UserRole;
  reason?: string;
}

export class UpdateUserRoleHandler implements ICommandHandler<UpdateUserRoleInput, CommandResult<UserDTO>> {
  constructor(private readonly userService: UserService) {}

  async handle(input: UpdateUserRoleInput): Promise<CommandResult<UserDTO>> {
    const dto = await this.userService.updateUserRole(input.userId, input.role);
    return CommandResult.success(dto);
  }
}

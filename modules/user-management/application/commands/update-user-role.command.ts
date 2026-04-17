import { UserService } from '../services/user.service';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserDTO } from '../../domain/entities/user.entity';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface UpdateUserRoleCommand extends ICommand {
  readonly userId: string;
  readonly role: UserRole;
  readonly reason?: string;
}

export class UpdateUserRoleHandler implements ICommandHandler<UpdateUserRoleCommand, CommandResult<UserDTO>> {
  constructor(private readonly userService: UserService) {}

  async handle(command: UpdateUserRoleCommand): Promise<CommandResult<UserDTO>> {
    const dto = await this.userService.updateUserRole(command.userId, command.role);
    return CommandResult.success(dto);
  }
}

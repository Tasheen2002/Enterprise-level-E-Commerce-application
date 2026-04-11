import { UserService } from '../services/user.service';
import { UserDTO } from '../../domain/entities/user.entity';
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
  constructor(private readonly userService: UserService) {}

  async handle(input: ToggleUserEmailVerifiedInput): Promise<CommandResult<UserDTO>> {
    const dto = await this.userService.toggleEmailVerified(input.userId, input.isVerified);
    return CommandResult.success(dto);
  }
}

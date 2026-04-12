import { AuthenticationService } from '../services/authentication.service';
import { UserService } from '../services/user.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';

export interface DeleteAccountCommand extends ICommand {
  userId: string;
  password: string;
  currentAccessToken?: string;
}

export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCommand, CommandResult<void>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async handle(command: DeleteAccountCommand): Promise<CommandResult<void>> {
    await this.authService.verifyUserPassword(command.userId, command.password);
    await this.userService.deleteUser(command.userId);
    if (command.currentAccessToken) {
      this.tokenBlacklistService.blacklistToken(command.currentAccessToken);
    }
    return CommandResult.success();
  }
}

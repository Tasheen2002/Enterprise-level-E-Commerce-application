import { AuthenticationService } from '../services/authentication.service';
import { UserService } from '../services/user.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import {
  ICommand,
  ICommandHandler,
} from '../../../../packages/core/src/application/cqrs';
import { CommandResult } from '../../../../packages/core/src/application/command-result';

export interface DeleteAccountInput extends ICommand {
  userId: string;
  password: string;
  currentAccessToken?: string;
}

export class DeleteAccountHandler implements ICommandHandler<DeleteAccountInput, CommandResult<void>> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userService: UserService,
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async handle(input: DeleteAccountInput): Promise<CommandResult<void>> {
    await this.authService.verifyUserPassword(input.userId, input.password);
    await this.userService.deleteUser(input.userId);
    if (input.currentAccessToken) {
      this.tokenBlacklistService.blacklistToken(input.currentAccessToken);
    }
    return CommandResult.success();
  }
}

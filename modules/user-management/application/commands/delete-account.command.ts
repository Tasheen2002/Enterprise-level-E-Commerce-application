import { AuthenticationService } from '../services/authentication.service';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserNotFoundError } from '../../domain/errors/user-management.errors';
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

export class DeleteAccountHandler
  implements ICommandHandler<DeleteAccountInput, CommandResult<void>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userRepository: IUserRepository,
    private readonly tokenBlacklistService: ITokenBlacklistService
  ) {}

  async handle(
    input: DeleteAccountInput
  ): Promise<CommandResult<void>> {
    // Step 1: Verify password
    await this.authService.verifyUserPassword(input.userId, input.password);

    // Step 2: Delete the user
    const userId = UserId.fromString(input.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }
    await this.userRepository.delete(userId);

    // Step 3: Blacklist current access token
    if (input.currentAccessToken) {
      this.tokenBlacklistService.blacklistToken(input.currentAccessToken);
    }

    return CommandResult.success();
  }
}
